module.exports = {
    //recreate: true,


    table: {
        wallet: {
            //recreate: true,
            name: 'wallet',
            fields: {
                wid: {type: 'varchar(36)', primary: true},
                creator: {type: 'varchar(36)', index: true},
                createDate: {type: 'timestamp', index: true},
                blocked: {type: 'boolean', index: true, value: false}
            },
            init: [
                {
                    wid: 'THEWALLET',
                    creator: 'MAINPROJ',
                    createDate: +new Date()
                }
            ]
        },
        balance: {
            //recreate: true,
            name: 'balance',
            fields: {
                wid: {type: 'varchar(36)'},
                currency: {type: 'int'},
                amount: {type: 'bigint', value: 0}
            },
            index: [['wid', 'currency']],
            init: [
                {wid: 'THEWALLET', currency: 0, amount: 0}
            ]
        },
        transaction: {
            //recreate: true,
            name: 'transaction',
            fields: {
                tid: {type: 'bigserial', primary: true},
                from: {type: 'varchar(36)', index: true},
                currency: {type: 'int'},
                to: {type: 'varchar(36)', index: true},
                amount: {type: 'bigint'},
                createDate: {type: 'timestamp', index: true},
                type: {type: 'bigint', index: true}
            }
        },
        transaction_type: {
            name: 'transaction_type',
            fields: {
                tnid: {type: 'bigserial', primary: true},
                name: { type: 'varchar(36)', index: true},
                service: { type: 'varchar(36)', index: true}
            },
            init: [
                {tnid: 1, name: 'terasms', service: 'sms'},
                {tnid: 2, name: 'income', service: 'internal'},
                {tnid: 3, name: 'ruru', service: 'mc'}
            ]
        }

    }
};

