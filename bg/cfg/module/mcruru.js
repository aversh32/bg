module.exports = {
    //recreate: true,
    table: {
        mcruru: {
            name: 'mcruru',
            fields: {
                ruruId: {type: 'bigint', index: true},
                uuid: {type: 'varchar(36)', index: true},
                amount: {type: 'bigint'},
                payer: {type: 'text'},
                createDate: { type: 'timestamp'},
                resultDate: { type: 'timestamp'},
                status: { type: 'smallint' },
                info: {type: 'text'},
                reason: {type: 'text'}
            }
        }
    }
};