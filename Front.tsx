// Страница рейтинга аптек в регионе

import React, {useState, useEffect} from "react"
import "./pharmacyRating.css"
import Loader from "../../../UI/Loader"
import {withRouter, Link, RouteComponentProps} from "react-router-dom"
import Dropdown from "react-bootstrap/Dropdown"
import {AiFillQuestionCircle} from "react-icons/ai"
import OverlayTrigger from "react-bootstrap/OverlayTrigger"
import {getCookie, createCookie, cookieType} from "../../../Cookies"
import Popover from 'react-bootstrap/Popover'
import HelpModal from "./HelpModal"
import Button from "react-bootstrap/Button"
import { Table } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import newError from "../../ErrorFallback/newError";
import {useAllRatingPharmacyInRegionLazyQuery} from "../../queries.generated";
import { RatingSortTypeEnum, RaitingPharmacy, Raiting_T } from "../../types"


const shortid = require('shortid')

interface IPharmacyRating extends RouteComponentProps {
    isAuth: boolean,
    region: any,
    districtsList: any,
    area: any
}
const PharmacyRating = ({ isAuth, region, districtsList, area }: IPharmacyRating) => {
    const [sortBy, setSortBy]: any = useState<RatingSortTypeEnum>(RatingSortTypeEnum.Rating)
    const [sortedInfo, setSortedInfo] = useState<SorterResult<RaitingPharmacy>>({});
    const [sortName, setSortName]: any = useState("Рейтинг Аптеки")
    const [helpModal, setHelpModal] = useState(false)
    const [helpText, setHelpText] = useState('')
    const expiresCookies = new Date(Date.now() + 43200000)
    const popover = (value: any) => (
        <Popover id="popover-basic">
            <Popover.Body>
                {value}
            </Popover.Body>
        </Popover>
    )

    let regionCode = area ? area.id : districtsList ? districtsList.id : region.id
    const [allRating, allRatingResult] = useAllRatingPharmacyInRegionLazyQuery({
        variables: {
            filter:
                {
                    regionCode: regionCode,
                    sortType: sortBy
                }
        }
    })

    const columns: ColumnsType<RaitingPharmacy> = [
        {
            title:
                <div className="tableHead">Aптека
                    <OverlayTrigger trigger={["hover", "focus"]} placement="right" overlay={popover(
                        'Для получения дополнительной информации:\n' +
                        '- как добраться\n' +
                        '- наличие скидок/дисконтных программ\n' +
                        '- режим работы по дням недели\n' +
                        '- размещение аптеки на карте.\n' +
                        'нажмите на наименование аптеки'
                    )}>
                        <Button className="table-header-question">
                            <AiFillQuestionCircle onClick={() => {
                                setHelpModal(true)
                                setHelpText('Для получения дополнительной информации:\n' +
                                    '- как добраться\n' +
                                    '- наличие скидок/дисконтных программ\n' +
                                    '- режим работы по дням недели\n' +
                                    '- размещение аптеки на карте.\n' +
                                    'нажмите на наименование аптеки')
                            }} style={{ color: 'black' }} />
                        </Button>
                    </OverlayTrigger>
                </div>,
            dataIndex: 'pharmacyName',
            key: 'pharmacy',
            className: 'pharmacyCell',
            render: (pharmacyName: string, data: RaitingPharmacy) =>
                <div className="pharmacyCell">
                    <Link to={`${process.env.PUBLIC_URL}/pharmacy/${data.raitingInfo.address_id}`} key={shortid.generate()}>
                        {pharmacyName}
                    </Link><br/>
                    <span key={shortid.generate()}>
                        {data.pharmacyAdress}
                    </span>
                </div>

        },
        {
            title:
                <div className="tableHead">Оценок от Покупателей
                    <OverlayTrigger trigger={["hover", "focus"]} placement="right" overlay={popover(
                        'Количество выставленных оценок для выбранной аптеки от покупателей, в рамках нашего ресурса'
                    )}>
                        <Button className="table-header-question">
                            <AiFillQuestionCircle onClick={() => {
                                setHelpModal(true)
                                setHelpText('Количество выставленных оценок для выбранной аптеки от покупателей, в рамках нашего ресурса')
                            }} style={{ color: 'black' }} />
                        </Button>
                    </OverlayTrigger>
                </div>,
            dataIndex: 'raitingInfo',
            key: 'count_Ratings',
            className: 'tableCell',
            sortDirections: ['ascend', 'descend', 'ascend'],
            sorter: (a, b) => a.raitingInfo.count_Ratings - b.raitingInfo.count_Ratings,
            sortOrder: sortedInfo.columnKey === 'count_Ratings' ? sortedInfo.order : null,
            render: (raitingInfo: Raiting_T) => <p>{raitingInfo.count_Ratings}</p>
        },
        {
            title:
                <div className="tableHead">Заказов
                    <OverlayTrigger trigger={["hover", "focus"]} placement="right" overlay={popover(
                        'Количество заказов в выбранной аптеке в рамках нашего ресурса'
                    )}>
                        <Button className="table-header-question">
                            <AiFillQuestionCircle onClick={() => {
                                setHelpModal(true)
                                setHelpText('Количество заказов в выбранной аптеке в рамках нашего ресурса')
                            }} style={{ color: 'black' }} />
                        </Button>
                    </OverlayTrigger>
                </div>,
            dataIndex: 'raitingInfo',
            key: 'count_Orders',
            className: 'tableCell',
            sortDirections: sortBy == RatingSortTypeEnum.CountOrders ? ['ascend', 'descend', 'ascend'] : ['descend', 'ascend', 'descend'],
            sorter: (a, b) => a.raitingInfo.count_Orders - b.raitingInfo.count_Orders,
            sortOrder: sortedInfo.columnKey === 'count_Orders' ? sortedInfo.order : null,
            render: (raitingInfo: Raiting_T) => <p>{raitingInfo.count_Orders}</p>
        },
        {
            title:
                <div className="tableHead">Товаров в заказах
                    <OverlayTrigger trigger={["hover", "focus"]} placement="right" overlay={popover(
                        'Количество наименований товара в выбранной аптеке по всем заказам, в рамках нашего ресурса'
                    )}>
                        <Button className="table-header-question">
                            <AiFillQuestionCircle onClick={() => {
                                setHelpModal(true)
                                setHelpText('Количество наименований товара в выбранной аптеке по всем заказам, в рамках нашего ресурса')
                            }} style={{ color: 'black' }} />
                        </Button>
                    </OverlayTrigger>
                </div>,
            dataIndex: 'raitingInfo',
            key: 'count_Lines',
            className: 'tableCell',
            sortDirections: sortBy == RatingSortTypeEnum.CountLines ? ['ascend', 'descend', 'ascend'] : ['descend', 'ascend', 'descend'],
            sorter: (a, b) => a.raitingInfo.count_Lines - b.raitingInfo.count_Lines,
            sortOrder: sortedInfo.columnKey === 'count_Lines' ? sortedInfo.order : null,
            render: (raitingInfo: Raiting_T) => <p>{raitingInfo.count_Lines}</p>
        },
        {
            title:
                <div className="tableHead">Упаковок в заказах
                    <OverlayTrigger trigger={["hover", "focus"]} placement="right" overlay={popover(
                        'Количество упаковок по заказанным товарам в выбранной аптеке по всем заказам, в рамках нашего ресурса'
                    )}>
                        <Button className="table-header-question">
                            <AiFillQuestionCircle onClick={() => {
                                setHelpModal(true)
                                setHelpText('Количество упаковок по заказанным товарам в выбранной аптеке по всем заказам, в рамках нашего ресурса')
                            }} style={{ color: 'black' }} />
                        </Button>
                    </OverlayTrigger>
                </div>,
            dataIndex: 'raitingInfo',
            key: 'count_Units',
            className: 'tableCell',
            sortDirections: sortBy == RatingSortTypeEnum.CountUnits ? ['ascend', 'descend', 'ascend'] : ['descend', 'ascend', 'descend'],
            sorter: (a, b) => a.raitingInfo.count_Units - b.raitingInfo.count_Units,
            sortOrder: sortedInfo.columnKey === 'count_Units' ? sortedInfo.order : null,
            render: (raitingInfo: Raiting_T) => <p>{raitingInfo.count_Units}</p>
        },
        {
            title: <div className="tableHead">Сумма заказов, руб</div>,
            dataIndex: 'raitingInfo',
            key: 'sum_Orders',
            className: 'tableCell',
            sortDirections: sortBy == RatingSortTypeEnum.SumOrders ? ['ascend', 'descend', 'ascend'] : ['descend', 'ascend', 'descend'],
            sorter: (a, b) => a.raitingInfo.sum_Orders - b.raitingInfo.sum_Orders,
            sortOrder: sortedInfo.columnKey === 'sum_Orders' ? sortedInfo.order : null,
            render: (raitingInfo: Raiting_T) => <p>{raitingInfo.sum_Orders}</p>
        },
        {
            title:
                <div className="tableHead">Покупателей
                    <OverlayTrigger trigger={["hover", "focus"]} placement="left" overlay={popover(
                        'Количество покупателей, выбравших для заказа именно эту аптеку в рамках нашего ресурса'
                    )}>
                        <Button className="table-header-question">
                            <AiFillQuestionCircle onClick={() => {
                                setHelpModal(true)
                                setHelpText('Количество покупателей, выбравших для заказа именно эту аптеку в рамках нашего ресурса')
                            }} style={{ color: 'black' }} />
                        </Button>
                    </OverlayTrigger>
                </div>,
            dataIndex: 'raitingInfo',
            key: 'buyers_All',
            className: 'tableCell',
            sortDirections: sortBy == RatingSortTypeEnum.CountBuyers ? ['ascend', 'descend', 'ascend'] : ['descend', 'ascend', 'descend'],
            sorter: (a, b) => a.raitingInfo.buyers_All - b.raitingInfo.buyers_All,
            sortOrder: sortedInfo.columnKey === 'buyers_All' ? sortedInfo.order : null,
            render: (raitingInfo: Raiting_T) => <p>{raitingInfo.buyers_All}</p>
        },
        {
            title:
                <div className="averageConfirmationTimeTitle">Среднее время подтверждения, минут
                    <OverlayTrigger trigger={["hover", "focus"]} placement="left" overlay={popover(
                        'Среднее значение времени подтверждения сделанного заказа, в рамках нашего ресурса'
                    )}>
                        <Button className="table-header-question">
                            <AiFillQuestionCircle onClick={() => {
                                setHelpModal(true)
                                setHelpText('Среднее значение времени подтверждения сделанного заказа, в рамках нашего ресурса')
                            }} style={{ color: 'black' }} />
                        </Button>
                    </OverlayTrigger>
                </div>,
            dataIndex: 'raitingInfo',
            key: 'average_Confirmation_Time',
            className: 'tableCell',
            sortDirections: sortBy == RatingSortTypeEnum.AverageConfirmationTime ? ['descend', 'ascend', 'descend'] : ['ascend', 'descend', 'ascend'],
            sorter: (a, b) => a.raitingInfo.average_Confirmation_Time - b.raitingInfo.average_Confirmation_Time,
            sortOrder: sortedInfo.columnKey === 'average_Confirmation_Time' ? sortedInfo.order : null,
            render: (raitingInfo: Raiting_T) => <p>{raitingInfo.average_Confirmation_Time}</p>
        },
        {
            title:
                <div className="tableHead">Рейтинг Аптеки
                    <OverlayTrigger trigger={["hover", "focus"]} placement="left" overlay={popover(
                        'Рейтинг аптеки по оценкам покупателей в рамках нашего ресурса'
                    )}>
                        <Button className="table-header-question">
                            <AiFillQuestionCircle onClick={() => {
                                setHelpModal(true)
                                setHelpText('Рейтинг аптеки по оценкам покупателей в рамках нашего ресурса')
                            }} style={{ color: 'black' }} />
                        </Button>
                    </OverlayTrigger>
                </div>,
            dataIndex: 'raitingInfo',
            key: 'raiting',
            className: 'tableCell',
            sortDirections: sortBy == RatingSortTypeEnum.Rating ? ['ascend', 'descend', 'ascend'] : ['descend', 'ascend', 'descend'],
            sorter: (a, b) => a.raitingInfo.raiting - b.raitingInfo.raiting,
            sortOrder: sortedInfo.columnKey === 'raiting' ? sortedInfo.order : null,
            render: (raitingInfo: Raiting_T) => <p>{raitingInfo.raiting}</p>
        }
    ];

    const handleChange: TableProps<RaitingPharmacy>['onChange'] = (pagination, filters, sorter) => {
        setSortedInfo(sorter as SorterResult<RaitingPharmacy>);
    };

    useEffect(() => {
        if (allRatingResult.error) {
            newError(allRatingResult.error)
        }
    }, [allRatingResult.error])

    useEffect(() => {
        var typeSort = getCookie(cookieType.rating);
        setSortBy(typeSort ? getCookie(cookieType.rating).sortBy : RatingSortTypeEnum.Rating);
        setSortName(typeSort ? getCookie(cookieType.rating).name : "Рейтинг Аптеки")
    }, [])

    useEffect(() => {
        if (!allRatingResult.loading && !allRatingResult.data) {
            allRating()
        }
    }, [sortBy])

    return (
        <React.Fragment>
            <HelpModal helpText={helpText} show={helpModal}
                       onHide={() => setHelpModal(false)} />
            <h5>Рейтинг Аптек ( учитываются показатели за последние 3 месяца)</h5>

            <Dropdown className="sortDropdown">
                <span style={{ display: 'block' }}>Упорядочить по:</span>
                <Dropdown.Toggle id="dropdown-button-dark-example1" variant="secondary">
                    {sortName}
                </Dropdown.Toggle>

                <Dropdown.Menu variant="light">
                    <Dropdown.Item onClick={() => {
                        setSortedInfo({})
                        setSortBy(RatingSortTypeEnum.Rating);
                        setSortName("Рейтинг Аптеки");
                        createCookie(cookieType.rating, [RatingSortTypeEnum.Rating, "Рейтинг Аптеки"], '/', expiresCookies)
                    }}>
                        Рейтинг Аптеки
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                        setSortedInfo({})
                        setSortBy(RatingSortTypeEnum.CountOrders);
                        setSortName("Кол-во заказов");
                        createCookie(cookieType.rating, [RatingSortTypeEnum.CountOrders, "Кол-во заказов"], '/', expiresCookies)
                    }}>Кол-во заказов</Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                        setSortedInfo({})
                        setSortBy(RatingSortTypeEnum.CountLines);
                        setSortName("Кол-во товаров в заказах");
                        createCookie(cookieType.rating, [RatingSortTypeEnum.CountLines, "Кол-во товаров в заказах"], '/', expiresCookies)
                    }}>Кол-во товаров в заказах</Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                        setSortedInfo({})
                        setSortBy(RatingSortTypeEnum.CountUnits);
                        setSortName("Кол-во упаковок в заказах");
                        createCookie(cookieType.rating, [RatingSortTypeEnum.CountUnits, "Кол-во упаковок в заказах"], '/', expiresCookies)
                    }}>Кол-во упаковок в заказах</Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                        setSortedInfo({})
                        setSortBy(RatingSortTypeEnum.SumOrders);
                        setSortName("Сумма заказов");
                        createCookie(cookieType.rating, [RatingSortTypeEnum.SumOrders, "Сумма заказов"], '/', expiresCookies)
                    }}>Сумма заказов</Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                        setSortedInfo({})
                        setSortBy(RatingSortTypeEnum.CountBuyers);
                        setSortName("Кол-во покупателей");
                        createCookie(cookieType.rating, [RatingSortTypeEnum.CountBuyers, "Кол-во покупателей"], '/', expiresCookies)
                    }}>Кол-во покупателей</Dropdown.Item>
                    <Dropdown.Item onClick={() => {
                        setSortedInfo({})
                        setSortBy(RatingSortTypeEnum.AverageConfirmationTime);
                        setSortName("Время подтвержения");
                        createCookie(cookieType.rating, [RatingSortTypeEnum.AverageConfirmationTime, "Время подтвержения"], '/', expiresCookies)
                    }}>Время подтвержения</Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
            <Table columns={columns} dataSource={allRatingResult?.data?.allRaitingPharmacyInRegion}
                   loading={allRatingResult.loading} bordered pagination={false}
                   locale={{
                       emptyText: 'В выбранном регионе не найдено аптек с рейтингом.',
                       triggerDesc: 'Сортировать по убыванию',
                       triggerAsc: 'Сортировать по возрастанию',
                       cancelSort: 'Отменить сортировку'
                   }}
                   onChange={handleChange}
            />
            {
                allRatingResult.loading ?
                    <Loader /> :
                    allRatingResult.data &&
                    allRatingResult.data?.allRaitingPharmacyInRegion?.length == 0 &&
                    <h3>В выбранном регионе не найдено аптек с рейтингом.</h3>
            }
        </React.Fragment>
    )
}
export default withRouter(PharmacyRating)