module.exports = {

    table: {
        mcocean: {
            name: 'mcocean',
            fields: {
                tid: {type: 'varchar(36)', primary: true},
                ocid: {type: 'varchar(36)'},
                aid: {type: 'bigint', index: true},
                amount: {type: 'bigint'},
                payer: {type: 'varchar(10)'},
                createDate: { type: 'timestamp'},
                status: { type: 'smallint' },
                statusInfo: {type: 'text'},
                billTo: {type:'varchar(16)'},
                info: {type: 'text'},
                reason: {type: 'text'},
                statusFixed: {type: 'smallint', index: true, value: 0}
            },
            index: [['tid','aid']]
        }
    }
};