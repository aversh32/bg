/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * *
 */
;// Copyright by Ivan Kubota. 10/7/2015
module.exports = {
    //recreate: true,
    table: {
        event: {
            name: 'event',
            fields: {
                eid: {type: 'bigserial', primary: true},

                event: {type: 'varchar(16)'},
                type: {type: 'varchar(12)'},
                iid: {type: 'varchar(36)'},

                date: { type: 'timestamp', index: true},
                data: { type: 'text'}
            },
            index: [['type','iid', 'event']]
        },
        eventTrash: {
            name: 'event_trash',
            fields: {
                eid: {type: 'bigserial', primary: true},

                event: {type: 'varchar(16)'},
                type: {type: 'varchar(12)'},
                iid: {type: 'varchar(36)', index: true},

                date: { type: 'timestamp', index: true},
                data: { type: 'text'}
            }
        },
        lastReduce: {

            name: 'last_reduce',
            fields: {
                rid: {type: 'varchar(64)', primary: true},
                date: { type: 'timestamp'}, //date of sequence first member
                eid: {type: 'bigint'} //eid of sequence first member

            }
        }
    }
};