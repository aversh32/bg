module.exports = {

    table: {
        schedule: {
            //recreate: true,
            name: 'schedule',
            fields: {
                scid: {type: 'bigserial', primary: true},
                createDate: { type: 'timestamp'},
                module: {type: 'varchar(36)'},
                fn: {type: 'varchar(36)'},
                data: {type: 'text'},
                uid: {type: 'varchar(36)', index: true},
                recurrent: {type: 'smallint'},
                recurrentInfo: {type: 'text'},
                nextDate: {type: 'timestamp'},
                status: {type: 'smallint'},

                worker: {type: 'varchar(36)'}
            },
            index: [['status', 'next_date']]
        },
        scheduledone: {
            //recreate: true,
            name: 'scheduledone',
            fields: {
                scid: {type: 'bigint', index: true},
                actionDate: { type: 'timestamp', index: true},
                result: {type: 'text'}

                
            }
        }
    }
};