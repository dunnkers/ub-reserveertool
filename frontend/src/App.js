import { message, Card, Checkbox } from 'antd';
import 'antd/dist/antd.css';
import $ from 'jquery';
import React from 'react';
import './App.css';
import StudySlot from './components/StudySlot';
import Account from './components/Account';
import { constructPostForm } from './util/util'; 
import { BACKEND } from './util/config';

const INIT_STATE = {results: []};
const INIT_ACC_STATE = {reservations:[],triggers:[],filtered:false,
  account: null};
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {...INIT_STATE, ...INIT_ACC_STATE};
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

    $.ajax({
      url: 'https://libcal.rug.nl/ajax/calendar/list?c=7564&date=0000-00-00&perpage=96&page=1&audience=undefined&cats=&camps=&inc=0',
      dataType: 'jsonp'
    })
    .done((data) => this.setState({...data }))
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
      startdt
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
      return error.json().then(errobj => {
        console.warn('Request failed', errobj.err)
        if (errobj.err.includes('fully booked')) {
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

  render() {
    return (
      <div className="App">
        <div className="logo"></div>
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
        <div style={{margin:'30px',
          display:'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))',
          gridGap: '40px'
        }}>
          {
            this.state.results.length > 0 && this.state.account ? 
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
                                        planReservering={
                                          (result) => this.planReservering(result)
                                        }
                                        cancelReservering={
                                          (result) => this.cancelReservation(result)
                                        }
                                        trigger={result.trigger}
                                        />)
              : <>
              Loading may take up to around 15 seconds...
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
