import { message, Card, Checkbox,Select } from 'antd';
import 'antd/dist/antd.css';
import $ from 'jquery';
import React from 'react';
import './App.css';
import StudySlot from './components/StudySlot';
import Account from './components/Account';
import { constructPostForm } from './util/util'; 
import { BACKEND } from './util/config';

const { Option } = Select;

const INIT_STATE = {results: []};
const INIT_ACC_STATE = {reservations:[],triggers:[],filtered:false,
  account: null};
const LIBCAL = {
  'Heymans': {
    'cal_id': '7736',
    'fid': '5517',
    'domain': 'libcal-gmw.rug.nl',
  },
  'UB': {
    'cal_id': '7564',
    'fid': '5455',
    'domain': 'libcal.rug.nl',
  },
  'Harmonie ARTS': {
    'cal_id': '7814',
    'fid': '5569',
    'domain': 'libcal-arts.rug.nl'
  },
  'Harmonie JUR': {
    'cal_id': '7666',
    'fid': '5503',
    'domain': 'libcal-jur.rug.nl'
  },
  'Oude Boteringe 18': {
    'cal_id': '7836',
    'fid': '5503',
    'domain': 'libcal-jur.rug.nl'
  },
  'Duisenberg': {
    'cal_id': '7770',
    'fid': '5558',
    'domain': 'libcal-feb.rug.nl'
  }
}
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ...INIT_STATE,
      ...INIT_ACC_STATE, 
      libcal: {},
      force: false
    };
  }

  componentDidMount() {
    // const formdata = constructPostForm({
    //   lid: 1443,
    //   gid: 3634,
    //   eid: -1,
    //   seat: 1,
    //   seatId: 0,
    //   zone: 0,
    //   accessible: 0,
    //   powered: 0,
    //   start: '2020-11-22',
    //   end: '2020-11-23',
    //   pageIndex: 0,
    //   pageSize: 18,
    // });

    // // https://www.trustedsec.com/blog/setting-the-referer-header-using-javascript/
    // const savedPath = window.location.pathname;
    // const savedSearch = window.location.search;
    // window.history.replaceState(null, '', 'https://libcal.rug.nl/spaces?lid=1443');
    // fetch(`https://libcal.rug.nl/spaces/availability/grid`, {
    //   ...formdata,
    //   headers: {
    //     'accept': 'application/json, text/javascript, */*; q=0.01',
    //     'accept-encoding': 'gzip, deflate, br',
    //     'accept-language': 'en-US,en;q=0.9',
    //     'content-length': '126',
    //     'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    //     'dnt': '1',
    //     'sec-fetch-dest': 'empty',
    //     'sec-fetch-mode': 'cors',
    //     'sec-fetch-site': 'same-origin',
    //     'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.102 Safari/537.36',
    //     'x-requested-with': 'XMLHttpRequest',
    //   },
    //   mode: 'no-cors',
    //   // origin: 'https://libcal.rug.nl',
    //   // referrer: 'https://libcal.rug.nl/spaces?lid=1443',
    //   referrerPolicy: "no-referrer"  
    // })
    // .then(response => {
    //   if (!response.ok) throw response;
    //   console.log(response.json());
    //   window.history.replaceState(null, '', savedPath+savedSearch);
    // })
    // .catch(err => {
    //   console.warn(err);
    //   window.history.replaceState(null, '', savedPath+savedSearch);
    // });
    // let libcal = {};
    // if (window.location.pathname === '/glazengebouwtje') {
    //   libcal['cal_id'] = '7736';
    //   libcal['fid']    = '5517';
    //   libcal['domain'] = 'libcal-gmw.rug.nl';
    // } else { // UB
    //   libcal['cal_id'] = '7564';
    //   libcal['fid']    = '5455';
    //   libcal['domain'] = 'libcal.rug.nl';
    // }
    let libcal = LIBCAL['UB'];
    let name = 'UB';
    if (!!window.location.pathname) {
      const urlname = window.location.pathname.split('/')[1]
      if (LIBCAL.hasOwnProperty(urlname)) {
        name = urlname;
        libcal = LIBCAL[name];
      }
    }
    libcal['name'] = name;
    const force = !!(window.location.search.substr(1) === 'force');

    this.setLibcal(libcal, force);
  }

  setLibcal(libcal, force=false) {
    return new Promise((resolve) => {

      $.ajax({
        url: `https://${libcal['domain']}/ajax/calendar/list?c=${libcal['cal_id']}&date=0000-00-00&perpage=96&page=1&audience=undefined&cats=&camps=&inc=0`,
        // https://libcal-gmw.rug.nl/ajax/calendar/list?c=7736&date=0000-00-00&perpage=48&page=1&audience=undefined&cats=&camps=undefined&inc=0&callback=s_lc_calendar_card
        dataType: 'jsonp'
      })
      .done((data) => {
        this.setState({...data, libcal, force });
        resolve();
      })
    });
  }

  dateToStr(date) {
    return date.toDateString() + ', ' + date.toLocaleTimeString();
  }

  planReservering = event => {
    const event_id = event.id;
    console.log('reserveren, id=', event_id);
    const startdt = event.startdt;
    const regmsg = event.registration_msg;
    const fully_booked = regmsg && regmsg.msg.includes('fully booked');
    const not_open = regmsg && regmsg.msg.includes('Registrations open at');
    fetch(`${BACKEND}/register/`, constructPostForm({
      email: this.state.email,
      event_id,
      fully_booked,
      not_open,
      startdt,
      force: this.state.force,
      ...this.state.libcal
    }))
    .then(response => {
      if (!response.ok) throw response;
      return response.json();
    })
    .then(res => {
      const str = this.dateToStr(new Date(startdt))
      if ('message' in res && res.message.includes('scheduled')) {
        message.success('Scheduled '+str);
      } else {
        message.success('Reserved '+str);
      }
      return;
    })
    .catch (error => {
      if (!error.json) return message.error('Server down.');
      return error.json().then(errobj => {
        if (!errobj.err) return console.warn('We messed up. oops.', errobj);
        console.warn('Request failed', errobj.err)
        if (errobj.err.includes && errobj.err.includes('fully booked')) {
          message.error('Already fully booked 😕');
        } else {
          message.error(errobj.err);
        }
      })
    })
    // Finally (despite any errors)
    .then(_ => {
      return this.setReservations();
    });
  }

  setReservations = () => {
    fetch(`${BACKEND}/reservations/`, constructPostForm({
        email: this.state.email
    }))
    .then(response => response.json())
    .then(data => {
      const triggers = data.triggers;
      const reservations = data.reservations.concat(triggers);
      this.setState({ reservations, triggers });
    })
  }

  cancelReservation = event => {
    const event_id = event.id;
    console.log(event_id); 
    fetch(`${BACKEND}/cancel_reservation/`, constructPostForm({
        email: this.state.email,
        event_id
    }))
    .then(response => response.json())
    .then(() => {
      const startdt = event.startdt;
      const str = this.dateToStr(new Date(startdt))
      message.success('Cancelled '+str);
      this.setReservations()
    }).catch(() => message.warn('Could not cancel event '+event_id));
  }

  filter(e) {
    this.setState({ filtered: e.target.checked });
  }

  changeLibcal(name) {
    if (!LIBCAL.hasOwnProperty(name)) return console.warn('incorrect select');
    // message.success(`${name}`)
    this.setLibcal(LIBCAL[name]);
  }

  render() {
    return (
      <div className="App">
        <div className="logo">{this.state.force && "Force mode"}</div>
        <Account 
          setReservations={() => this.setReservations()}
          setAccount={accinfo => this.setState(accinfo)}
          style={{float:'right'}}
          loggedOut={() => this.setState(INIT_ACC_STATE)}
          />
        {/* <h2 style={{marginTop: '10px' }}>Reservations</h2> */}
        {this.state.account &&
          <Checkbox style={{marginTop:'10px'}} onChange={e => this.filter(e)}>
            Show only my reservations
          </Checkbox>
        }
        <Select defaultValue='UB' style={{ width: 120 }} onChange={e => this.changeLibcal(e)}
          style={{width:150}}>
          {Object.entries(LIBCAL).map(entry => {
            const name = entry[0];
            return (
              <Option value={name}>{name}</Option>
            );
          })}
        </Select>
        <div style={{margin:'30px',
          display:'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))',
          gridGap: '40px'
        }}>
          {
            this.state.results.length > 0 ? 
              this.state.results.map(result => {
                const trigger = this.state.triggers.includes(String(result.id));
                const booked = this.state.reservations.includes(String(result.id)) ||
                                trigger;
                return {
                  trigger,
                  booked,
                  ...result
                };
              })
              .filter(result => this.state.filtered ? result.booked : true)
              .map(result => <StudySlot key={result.id}
                                        slotinfo={result}
                                        account={this.state.account}
                                        booked={result.booked}
                                        force={this.state.force}
                                        planReservering={
                                          (result) => this.planReservering(result)
                                        }
                                        cancelReservering={
                                          (result) => this.cancelReservation(result)
                                        }
                                        trigger={result.trigger}
                                        />)
              : <>
              <Card loading={true} style={{ width: 320 }} />
              <Card loading={true} style={{ width: 320 }} />
              <Card loading={true} style={{ width: 320 }} />
              <Card loading={true} style={{ width: 320 }} />
              <Card loading={true} style={{ width: 320 }} />
              <Card loading={true} style={{ width: 320 }} />
              <Card loading={true} style={{ width: 320 }} />
            </>
          }
        </div>
      </div>
    );
  }
}

export default App;
