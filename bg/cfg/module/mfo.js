/**
 * Created by Ivan on 4/7/2015.
 */
module.exports = {
    table: {
        test_mfo: {
            name: 'test_mfo',
            //recreate: true,
            fields: {
                tid: {type: 'varchar(36)', primary: true},
                pid: {type: 'varchar(32)', index: true},
                lid: {type: 'bigint', index: true},

                createDate: {type: 'timestamp', index: true},

                // FROM:
                aid: {type: 'varchar(16)', index: true},
                type: {type: 'varchar(16)', index: true},
                gateId: {type: 'varchar(64)', index: true},

                // TO:
                provider: {type: 'varchar(32)'},
                account: {type: 'varchar(64)', index: true},

                // HOW MUCH:
                currency: {type: 'int'}, // to currency
                amount: {type: 'bigint', value: 0},

                // INFO:
                status: {type: 'smallint', index: true},
                comment: {type: 'text'},
                uid: {type: 'varchar(32)'},
                json: {type: 'text'}
            }
        },
        account: {
            recreate: true,
            name: 'mfo_accounts',
            fields: {
                aid: {type: 'varchar(16)', primary: true},
                pid: {type: 'varchar(32)', index: true},
                bankid: {type: 'varchar(64)', index: true},
                bankpass: {type: 'varchar(64)'},
                bankClient: {type: 'varchar(64)'},
                type: {type: 'varchar(16)', index: true},
                currency: {type: 'int'},
                lastAmount: {type: 'bigint', value: 0},
                lastOverdraft: {type: 'bigint', value: 0},
                lastAmountDate: {type: 'timestamp'},
                createDate: {type: 'timestamp'},
                name: {type: 'varchar(128)', index: true},
                json: {type: 'text'}
            },
            init: [
                {
                    aid:1,
                    pid: '1b57b5aa69ad5326874cb768ad0017f1',
                    bankid: 0,
                    bankpass:0,
                    bankClient: '',
                    type: 'mock',
                    currency: 643,
                    lastAmount: 10000,
                    lastAmountDate: new Date(),
                    createDate: new Date(),
                    name: 'Счёт 1'
                },
                {
                    aid: 2,
                    pid: '1b57b5aa69ad5326874cb768ad0017f1',
                    bankid: '31-10004911',
                    bankpass: '7951Cz17',
                    bankClient: '3837',
                    type: 'c24',
                    currency: 643,
                    lastAmount: 0,
                    lastAmountDate: new Date(),
                    createDate: new Date(),
                    name: 'Счёт 2'
                },
                {
                    aid: 3,
                    pid: '863f692f9ce5a49ac14232aaf107892f',
                    bankid: 0,
                    bankpass:0,
                    bankClient: '',
                    type: 'mock',
                    currency: 643,
                    lastAmount: 10000,
                    lastAmountDate: new Date(),
                    createDate: new Date(),
                    name: 'Тестовый счёт'
                },
                {
                    aid:4,
                    pid: '1b57b5aa69ad5326874cb768ad0017f1',
                    bankid: '31-10005518',
                    bankpass:'560Dr274',
                    bankClient: '3966',
                    type: 'c24',
                    currency: 643,
                    lastAmount: 0,
                    lastAmountDate: new Date(),
                    createDate: new Date(),
                    name: 'Счёт 666'
                },
                {
                    aid: 'cardpay-17v671',
                    pid: '863f692f9ce5a49ac14232aaf107892f',
                    bankid: '31-10005518',
                    bankpass:'560Dr274',
                    bankClient: '3966',
                    type: 'c24',
                    currency: 643,
                    lastAmount: 0,
                    lastAmountDate: new Date(),
                    createDate: new Date(),
                    name: 'Доступный баланс'
                }
            ]
        },
        list: {
            //recreate: true,
            name: 'mfo_t_list',
            fields: {
                lid: {type: 'bigserial', primary: true},
                pid: {type: 'varchar(32)', index: true},
                createDate: {type: 'timestamp', index: true},
                name: {type: 'varchar(128)', index: true}
            }
        },
        transaction: {
           //recreate: true,
            name: 'mfo_transaction',
            fields: {
                // SEARCH:
                tid: {type: 'varchar(36)', primary: true},
                pid: {type: 'varchar(32)', index: true},
                lid: {type: 'bigint', index: true},

                createDate: {type: 'timestamp', index: true},

                // FROM:
                aid: {type: 'varchar(16)', index: true},
                type: {type: 'varchar(16)', index: true},
                gateId: {type: 'varchar(64)', index: true},

                // TO:
                provider: {type: 'varchar(32)'},
                account: {type: 'varchar(64)', index: true},

                // HOW MUCH:
                currency: {type: 'int'}, // to currency
                amount: {type: 'bigint', value: 0},

                // INFO:
                status: {type: 'smallint', index: true},
                comment: {type: 'text'},
                uid: {type: 'varchar(32)'},
                json: {type: 'text'}
            }
        },
        status: {
            //recreate: true,
            name: 'mfo_status',
            fields: {
                tid: {type: 'varchar(36)', index: true},
                createDate: {type: 'timestamp', index: true},
                status: {type: 'smallint', index: true}
            }
        }
    }
};