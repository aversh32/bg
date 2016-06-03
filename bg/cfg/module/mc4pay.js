/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * *
 */
;// Copyright by Ivan Kubota. 2/5/2016
module.exports = {

    table: {
        mc4pay: {
            recreate: true,
            name: 'mc4pay',
            fields: {
                orderId: {type: 'varchar(36)', primary: true},
                tid: {type: 'varchar(20)', index: true},
                pid: {type: 'varchar(36)'},
                amount: {type: 'bigint'},
                payer: {type: 'varchar(12)'},
                createDate: { type: 'timestamp'},
                status: { type: 'smallint' },
                statusInfo: {type: 'text'},
                info: {type: 'text'},
                reason: {type: 'text'},
                statusFixed: {type: 'smallint', index: true, value: 0}
            }
        }
    }
};