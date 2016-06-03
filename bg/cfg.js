module.exports = {
    redis: {
        host: 'localhost',
        port: '6379'
    },
    rabbit: {
        host: 'localhost',
        port: '5672'
    },
    email: {
        user: '',
        password: '',
        host: 'localhost',
        ssl: false,
        tls: false
    },
    postgres: {
        host: 'localhost',
        user: 'postgres',
        password: '211095',
        database: 'cont',
        ssl: false                           //было тру
    },
    couch: {
        host: '127.0.0.1:5984'//192.168.150.5:5984
    },
    mc: {
        ruru: {
            key: './js/interface/mc/rurucert/client-ruru.api.billingrad.com.key',
            cert: './js/interface/mc/rurucert/client-ruru.api.billingrad.com.crt'
        }
    },
    smsGates: {
        terasms: {
            terasms: {
                "login": "billingrad",
                "password": "romaroma"
            },
            chipsms: {
                "login": "bg-d",
                "password": "gj5ijg50j509g",
                "sender": 'bg-d' // fix sender name
            },
            terasms2: {
                "login": "billingrad-bulk",
                "password": "romaroma"
                //,"sender": 'bg-d'
            }
        },
        smscenter: {
            'smscenter': {
                'login': 'billingrad',
                'password': 'XnQ-5L2-4Do-C6g'
            }
        },
        infobip: {
            'infobip': {
                'login': 'billingrad',
                'password': 'G_@Ndi7i'
            },
            'infobip-ussd': {
                'login': 'billingrad',
                'password': 'G_@Ndi7i',
                'flash': true
            }
        },
        mock: {
            mock: {
                login: 1,
                password: 2
            }
        },
        msg2: {
            whatsapp: {
                aid: '000124-0001',
                MethodID: 7,
                login: 'zibx.mail@gmail.com',
                password: '19841984',
                secret: 'Jsdhfdj34j'
            },
            telegram: {
                aid: '000124-0001',
                MethodID: 8,
                login: 'zibx.mail@gmail.com',
                password: '19841984',
                secret: 'Jsdhfdj34j'
            }
        }
    },
    module: {
        delivery: {
            table: {
                list: {
                    name: 'deliveries',
                    sort: {did: 'desc'},
                    fields: {
                        did: { primary: true, type: 'bigserial' },
                        name: { type: 'text' },
                        createDate: { type: 'timestamp' },
                        creator: { type: 'varchar(36)', index: true },
                        pid: { type: 'varchar(32)', index: true },
                        sendTo: { type: 'text' },
                        sender: { type: 'varchar(32)', index: true },
                        smsGate: {type: 'text'}
                    }
                },
                msg: {
                    name: 'delivery_msg',
                    sort: {mid: 'desc'},
                    fields: {
                        mid: { primary: true, type: 'bigserial' },
                        did: { type: 'bigint', index: true },
                        status: { type: 'smallint', index: true },
                        /*
                        0 - created,
                        1 - planned,
                        2 - prepare to send,
                        10 - sending,
                        15 - finished,
                        20 - recurrent
                        */
                        text: {type: 'text'},
                        sendTo: { type: 'text' },
                        createDate: { type: 'timestamp', index: true },
                        creator: { type: 'varchar(36)' },
                        sendDate: { type: 'timestamp' },
                        finishDate: { type: 'timestamp' },
                        deliveryCount: { type: 'int' },
                        failedCount: { type: 'int' },
                        progressCount: { type: 'int' }
                    }
                },
                status: {
                    name: 'delivery_status',
                    fields: {
                        mid: { type: 'bigint' },
                        cid: { type: 'varchar(36)' }, // it may be phone or contact id
                        status: { type: 'smallint', index: true },
                        gate: { type: 'varchar(12)', index: true },
                        gateId: { type: 'varchar(32)' }

                    },
                    index: [['mid','cid']]

                }
            }
        },
        contacts: {
            table: {
                contacts: {
                    sort: {cid: 'asc'},
                    name: 'contacts',
                    fields: {
                        cid: { primary: true, type: 'bigserial' },
                        lid: { type: 'bigint', index: true },
                        phone: { type: 'varchar(16)' },
                        json: { type: 'text' }

                    }
                },
                list: {
                    sort: {createDate: 'desc'},
                    //recreate: true,
                    name: 'contact_list',
                    fields: {
                        lid: { primary: true, type: 'bigserial' },
                        createDate: { type: 'timestamp' },
                        creator: { type: 'varchar(36)', index: true },
                        name: { type: 'text' },
                        length: { type: 'bigint' }
                    }
                }
            }
        },
        costs: {

            table: {
                base: { // prices that we pay

                    name: 'base_costs',
                    fields: {
                        bcid: { primary: true, type: 'bigserial' },
                        gate: { type: 'varchar(12)', index: true },
                        service: { type: 'varchar(12)', index: true },
                        type: { type: 'varchar(12)', index: true },
                        cost: { type: 'bigint' }, // cost in plank prices
                        createDate: { type: 'timestamp', index: true }
                    }
                },
                project: { // prices bunches for projects
                    name: 'project_costs',
                    fields: {
                        pcid: { primary: true, type: 'bigserial' },
                        pid: { type: 'varchar(32)', index: true },
                        service: { type: 'varchar(12)', index: true },
                        type: { type: 'varchar(12)', index: true },
                        cost: { type: 'bigint' }, // cost in plank prices
                        createDate: { type: 'timestamp', index: true },
                        amount: { type: 'bigint' },
                        pack: { type: 'bigint' },
                            /*0: unlim
                            1: limited count
                            2: limited month (30 days)
                            3: limited month (till end of)
                            //4: till end of year
                            */
                        blocked: { type: 'int' } // block reason. 0\null == not blocked
                    }
                },
                pack: { // packages that can be bought or applied manually to any project
                    name: 'packs_costs',
                    fields: {
                        packid: { primary: true, type: 'bigserial' },
                        amount: { type: 'bigint' },
                        type: { type: 'varchar(12)', index: true },
                        duration: { type: 'bigint' },
                        pack: { type: 'bigint' },
                        createDate: { type: 'timestamp', index: true },
                        cost: { type: 'bigint' } // cost in plank prices
                        /*0: count limited (1000) - 550
                        1: count month limited (1000 month) - 500*/
                    }
                }
            }
        },
        log: {
            table: {
                apilog: {
                    recreate: true,
                    name: 'apilog',
                    fields: {
                        eid: {type: 'bigserial', primary: true},
                        u: { type: 'varchar(36)'},
                        module: { type: 'varchar(12)' },
                        fn: { type: 'text' },
                        data: { type: 'text' },
                        createDate: { type: 'timestamp', index: true }
                    },
                    index: [['u','create_date']]
                },
                apianswer: {
                    recreate: true,
                    name: 'apianswer',
                    fields: {
                        aid: {type: 'bigserial', primary: true},
                        eid: {type: 'bigint', index:true},
                        data: {type: 'text'}
                    }
                }
            }
        },
        agree: {
            table: {
                agree: {
                    //recreate: true,
                    name: 'agree',
                    fields: {
                        aid: {type: 'bigserial', primary: true},
                        type: { type: 'varchar(36)', index: true},
                        u: { type: 'varchar(36)', index: true},
                        createDate: { type: 'timestamp', index: true},
                        data: { type: 'text' }
                    }
                }
            }
        }
    }
};
Z.applyDeep(
    module.exports,
    Z.includeCfgSync(App.cfg || './cfg/')
);
/*
contactList with filter
list id

 */