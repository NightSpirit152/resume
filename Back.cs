// Вывод рейтинга аптек в регионе        
public IQueryable<RaitingPharmacy> GetAllRaitingPharmacyInRegionAsync(
            RatingFarmacyFilter filter)
        {
            var dataBuilder = db.AdrObj.Join(db.AdrObj, e => e.ParentId, e => e.Id,
                (x, y) => new { Obj = x, Parent = y }).
                Where(e =>
                    e.Obj.Id == filter.RegionCode ||
                    e.Obj.ParentId == filter.RegionCode ||
                    e.Parent.ParentId == filter.RegionCode).
                Join(db.AdrObjAddresses, e => e.Obj.Id, e => e.AdrObjId, (x, y) => y).
                Join(db.Raiting_t, e => e.AddressId, e => e.address_id, (x, y) => y);

            switch (filter.SortType)
            {
                case RatingSortTypeEnum.Rating:
                    dataBuilder = dataBuilder.OrderByDescending(e => e.Raiting).ThenByDescending(e => e.Count_Orders);
                    break;
                case RatingSortTypeEnum.CountOrders:
                    dataBuilder = dataBuilder.OrderByDescending(e => e.Count_Orders);
                    break;
                case RatingSortTypeEnum.CountBuyers:
                    dataBuilder = dataBuilder.OrderByDescending(e => e.Buyers_All);
                    break;
                case RatingSortTypeEnum.CountLines:
                    dataBuilder = dataBuilder.OrderByDescending(e => e.Count_Lines);
                    break;
                case RatingSortTypeEnum.SumOrders:
                    dataBuilder = dataBuilder.OrderByDescending(e => e.Sum_Orders);
                    break;
                case RatingSortTypeEnum.CountUnits:
                    dataBuilder = dataBuilder.OrderByDescending(e => e.Count_Units);
                    break;
                case RatingSortTypeEnum.AverageConfirmationTime:
                    dataBuilder = dataBuilder.OrderBy(e => e.Average_Confirmation_Time);
                    break;
                default:
                    throw new Exception("Не удалось распознать тип сортировки");
            }
            return dataBuilder.
                Join(db.Addresses,
                    e => e.address_id,
                    e => e.Id,
                    (z, y) => new RaitingPharmacy(z, y.Address ?? string.Empty, y.address_name ?? string.Empty));
        }

        // Проверка наличия товара на складе
        public async Task<IList<Basket>> CheckBasketStock(UserManager<ApplicationUser> userManager, string phone,
            bool firstCheck, int orderId = 0)
        {
            var user = userManager.Users.FirstOrDefault(x => x.PhoneNumber == phone);
            if (user is null)
            {
                throw new Exception($"Некоректный запрос. Пользователь не найден(phone={phone})");
            }
            
            List<Basket> baskets = new List<Basket>();

            var orderLines = db.reservation_order_lines
                .Where(ol => ol.Offer.STU == 1)
                .Include(x => x.Order)
                .Where(x => orderId != 0
                    ? x.Order.Id == orderId
                    : x.Order.userId == user.Id && x.Order.Status == OrderStatus.created && x.Hidden == 0)
                .Join(db.Stocks, ol => ol.Offer.StockId, s => s.Id, (ol, s) => new { orderLines = ol, stock = s })
                .OrderBy(x => x.orderLines.ProductName)
                .ToList();

            if (!orderLines.Any())
            {
                return new List<Basket>{ new() { Updated = true } };
            }

            foreach (var orderLine in orderLines)
            {
                var line = orderLine.orderLines;
                var stock = orderLine.stock;
                var order = line.Order;

                if (line.Quantity > stock.Quantity)
                {
                    if (firstCheck)
                    {
                        baskets.Add(new Basket
                        {
                            CommentForAdd = new CommentForAdd
                            {
                                UserQuantity = line.Quantity,
                                Product = line.ProductName,
                                Message = "Подтверждение заказа!",
                                Quantity = (int)stock.Quantity,
                                text = stock.Quantity > 0
                                    ? $"Товара '{line.ProductName}' нет в указанном количестве: {line.Quantity} шт.\nНа данный момент есть только в количестве: {(int)stock.Quantity} шт.\n"
                                    : $"Товара '{line.ProductName}' нет в наличии.\n",
                            }
                        });
                    }
                    else
                    {
                        if ((int)stock.Quantity != 0)
                        {
                            line.Quantity = (int)stock.Quantity;
                            line.Sum = (int)stock.Quantity * line.Cost;
                            line.SumWhisDiscount = (int)stock.Quantity * line.CostWhisDiscount;
                            db.reservation_order_lines.Update(line);
                        }
                        else
                        {
                            line.Hidden = 1;
                            db.reservation_order_lines.Update(line);
                            if (order.Lines.All(l => l.Hidden == 1))
                            {
                                order.Hidden = 1;
                                db.reservation_orders.Update(order);
                            }
                        }
                    }
                }
            }
            
            // Удалить заказы, если нет ни одной строки
            if (orderLines.Select(x => x.orderLines.Order).All(o => o.Hidden == 1))
            {
                baskets.Add(new Basket
                {
                    Empty = true,
                });
            }

            await db.SaveChangesAsync();
            return baskets.Count > 0 ? baskets : new List<Basket>{ new() { Updated = true } };
        }