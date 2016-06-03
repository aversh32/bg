/**
 * Created by Ivan on 4/7/2015.
 */
module.exports = {
    table: {
        infobip: {
            name: 'infobip',
            fields: {
                gateId: {type: 'varchar(36)', primary: true},
                phone: { type: 'varchar(16)' },
                status: { type: 'smallint' },
                price: {type: 'varchar(10)'},
                doneDate: { type: 'timestamp'},
                sentDate: { type: 'timestamp'}
            }
        },
        log: {
            name: 'infobiplog',
            fields: {
                lid: { primary: true, type: 'bigserial' },
                createDate: { type: 'timestamp', index: true },
                recieve: {type: 'text'}
            }
        },
        logstat: {
            name: 'infologstat',
            fields: {
                lid: { type: 'bigint', index: true },
                gateId: {type: 'varchar(36)', index: true}
            }
        }
    }
};