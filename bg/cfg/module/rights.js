module.exports = {
    //recreate: true,
    table: {
        role: {
            recreate: true,
            // user, creator, team
            name: 'role',
            fields: {
                rid: {type: 'bigserial', primary: true},
                name: { type: 'varchar(36)', index: true}
            },
            init: [
                {rid: 1, name: 'user'},
                {rid: 2, name: 'creator'},
                {rid: 3, name: 'team'},
                {rid: 4, name: 'smsSender'},
                {rid: 5, name: 'viewer'},
                {rid: 6, name: 'developer'},
                {rid: 7, name: 'bill'},
                {rid: 8, name: 'finance'},
                {rid: 9, name: 'wallet'},
                {rid: 10, name: '#costs'},
                {rid: 11, name: 'administrator'},
                {rid: 12, name: 'mfo'}
            ]
        },
        right: {
            recreate: true,
            name: 'rights',
            fields: {
                rid: {type: 'bigint', index: true},
                action: {type: 'varchar(36)'},
                type: { type: 'smallint' } // 1 if role
            },
            init: [
                // RS costs module
                {rid: 10, action: 'user.list', type: 0},
                {rid: 10, action: 'project.list', type: 0},
                {rid: 10, action: 'company.list', type: 0},
                {rid: 10, action: 'stats.view', type: 0},

                // PROJECT
                //creator
                {rid: 2, action: 'project.create', type: 0},
                {rid: 2, action: 'project.edit', type: 0},
                {rid: 2, action: 'project.viewBalance', type: 0},
                {rid: 2, action: 'project.addSender', type: 0},
                {rid: 2, action: 'project.remove', type: 0},
                {rid: 2, action: 'project.view', type: 0},
                {rid: 2, action: 'project.requestAbility', type: 0},

                //administrator
                {rid: 11, action: 'project.access', type: 0},

                    //{rid: 2, action: 'smsSender', type: 1},
                    {rid: 2, action: 'developer', type: 1},
                    {rid: 2, action: 'bill', type: 1},
                    {rid: 2, action: 'administrator', type: 1},

                // team
                {rid: 3, action: 'project.view', type: 0},
                {rid: 3, action: 'project.chat', type: 0},

                // viewer
                {rid: 5, action: 'project.view', type: 0},

                // sms sender
                {rid: 4, action: 'delivery.list', type: 0},
                {rid: 4, action: 'delivery.send', type: 0},
                {rid: 4, action: 'delivery.messageInfo', type: 0},
                {rid: 4, action: 'delivery.create', type: 0},
                {rid: 4, action: 'delivery.createMessage', type: 0},
                {rid: 4, action: 'delivery.edit', type: 0},

                // developer
                {rid: 6, action: 'getApiKeys', type: 0},
                {rid: 6, action: 'response.manage', type: 0},

                // bill
                {rid: 7, action: 'bill.create', type: 0},
                {rid: 7, action: 'bill.info', type: 0},
                // finance
                {rid: 8, action: 'bill.info', type: 0},

                // WALLET
                {rid: 9, action: 'wallet.access', type: 0},

                {rid: 12, action: 'mfo.balance', type: 0},
                {rid: 12, action: 'mfo.transaction', type: 0}
            ]
        },
        access: {
            name: 'access',
            fields: {
                uid: { type: 'varchar(36)', index: true},
                iid: { type: 'varchar(36)', index: true},
                type: { type: 'smallint' }, // 1 system, 2 project
                rid: {type: 'bigint', index: true},
                createDate: { type: 'timestamp', index: true},
                granter: {type: 'varchar(36)'}
            },
            init: [
                {uid: 'USERNAME', iid: '*', type: 2, rid: 2},
                {uid: 'USERNAME', iid: '*', type: 2, rid: 4},
                {uid: 'OBSERVABLE', iid: '*', type: 2, rid: 5},
                {uid: 'OBSERVABLE', iid: '*', type: 2, rid: 3}
            ]
        },
        exceptions: {
            name: 'exceptions',
            fields: {
                uid: { type: 'varchar(36)', index: true},
                iid: { type: 'varchar(36)', index: true},
                action: {type: 'varchar(36)'},
                type: { type: 'smallint' }, // 1 can, 0 cannot
                createDate: { type: 'timestamp', index: true}
            }
        }


    }
};