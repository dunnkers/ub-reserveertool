

// module.exports.tryreg = function tryreg(regevents, email, registration) {
//     outer: for (let regevent of regevents) {
//         for (let event of regevent.events) {
//             if (regevent.got) continue outer;
//             registration(event, email).then(res => {
//                 console.log(new Date().toLocaleTimeString(),
//                     ': registered for ', event);
//                 regevent.got = true;
//             }).catch((e) => console.warn(new Date().toLocaleTimeString(),
//                 ': could not register ',
//                 event, ' > ', e));
//         }
//     }

// }

module.exports.regloop = function regloop(client, registration, timeout=10000) {
    const remove_samedate_regloop = (email, a_startdt, regloop) => {
        client.hget('event_startdts', regloop, (err, b_startdt) => {
            const a = new Date(a_startdt).getTime();
            const b = new Date(b_startdt).getTime();
            if (a === b) {
                console.log('removed same-date regloop ', regloop, 
                    new Date(a_startdt), email)
                return client.srem(email+':regloops', regloop);
            }
        });
    }

    const setregloop = (email, regloop) => {
        return new Promise((resolve, reject) => {
            client.hget('event_startdts', regloop, (err, startdt) => {
                if (err) return reject('Error in event_startdts lookup.', err)
                if (!startdt) return reject('No startdt found!')
    
                // remove outdated regloops
                const today = new Date();
                const outdated_regloop = new Date(startdt) < today;
                if (outdated_regloop) return client.srem(email+':regloops', regloop)
                
                registration(regloop, email).then(res => {
                    console.log(new Date().toLocaleTimeString(),
                        ': registered for ', res, ' >', res);
                    resolve(startdt);
                }).catch((e) => reject(new Date().toLocaleTimeString()+
                    ': could not register '+
                    regloop+ ' > '+ e));
            });
        });
    }

    const mapRegloop = regloop_account => {
        const email = regloop_account.split(':')[0];
        client.smembers(regloop_account, (err, regloops) => {
            if (err) return console.warn('`smembers` failed for '+regloop_account)
            regloops.forEach(regloop => {
                setregloop(email, regloop).then(startdt => {
                    // regloop succeeded, remove all same-date regloops
                    regloops.map(regloop_ => {
                        remove_samedate_regloop(email, startdt, regloop_);
                    });
                }).catch(e => console.warn(e));
            });
        });
    }

    const timeoutfunc = () => {
        console.log('Get all `*:regloops` keys. Looping regs...')
        client.keys('*:regloops', (err, regloop_accounts) => {
            if (err) return console.warn('Redis *:regloops lookup failed')
            regloop_accounts.map(mapRegloop);
        });

        setTimeout(timeoutfunc, timeout);
    };
    setTimeout(timeoutfunc, timeout);
}
