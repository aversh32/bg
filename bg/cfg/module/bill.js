module.exports = {
    //recreate: true,
    table: {
        bill: {
            name: 'bill',
            fields: {
                bid: {type: 'bigserial', primary: true},
                pid: {type: 'varchar(36)', index: true},
                uuid: {type: 'varchar(36)', index: true},
                amount: {type: 'bigint'},
                payer: {type: 'text'},
                createDate: { type: 'timestamp'},
                resultDate: { type: 'timestamp'},
                status: { type: 'smallint' },
                text: {type: 'text'},
                additional: {type: 'text'},
                type: {type: 'varchar(12)', index: true},
                category: {type: 'text'}
            }
        }
    }
};