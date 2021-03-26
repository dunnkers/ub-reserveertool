import { message, Card, Checkbox,Select, Empty, Pagination } from 'antd';
import 'antd/dist/antd.css';
import $ from 'jquery';
import React from 'react';
import './App.css';
import StudySlot from './components/StudySlot';
import Account from './components/Account';
import { constructPostForm } from './util/util'; 
import { BACKEND } from './util/config';
import moment from 'moment';

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
  'Harmonie - Faculty of Arts': {
    'cal_id': '7814',
    'fid': '5569',
    'domain': 'libcal-arts.rug.nl'
  },
  'Harmonie - Juridische Faculteit': {
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
    const libcal = localStorage.getItem('libcal') || 'UB';
    this.state = {
      ...INIT_STATE,
      ...INIT_ACC_STATE, 
      libcal,
      force: false,
      loadingEvents: false,
      page: 1,
      total_results: 20,
      pageSize: 20
    };
  }

  componentDidMount() {
    let name = this.state.libcal;
    
    if (!!window.location.pathname) {
      const urlname = window.location.pathname.split('/')[1]
      if (LIBCAL.hasOwnProperty(urlname)) {
        name = urlname;
      }
    }
    const force = !!(window.location.search.substr(1) === 'force');


    this.setLibcal(name, force);
  }

  getEvents(libcal_name, total=20, page=1) {
    if (!LIBCAL.hasOwnProperty(libcal_name)) return console.warn('no libcal for', libcal_name);
    const libcal = LIBCAL[libcal_name];
    return new Promise(resolve => {
      $.ajax({
        url: `https://${libcal['domain']}/ajax/calendar/list?c=${libcal['cal_id']}&date=0000-00-00&perpage=${total}&page=${page}&audience=undefined&cats=&camps=&inc=0`,
        dataType: 'jsonp'
      }).done(data => {
        data['libcal_name'] = libcal_name;
        resolve(data);
      })
    });
  }

  parseLibcalData(data) {
    if (!data || !data.results) return data;
    return data.results.map(result => {
      result['startdt_m'] = moment(result.startdt);
      result['enddt_m'] = moment(result.enddt);
      result['libcal_name'] = data.libcal_name;
      return result;
    })
  }

  setAllEvents(page, pageSize) {
    return Promise.all(
      Object.entries(LIBCAL).map(entry => {
        const libcal_name = entry[0];
        return this.getEvents(libcal_name, pageSize, page);
      })
    ).then(data => {
      const results = data.map(this.parseLibcalData)
        .reduce((acc, curr) => acc.concat(curr))
      const total_results = data.map(dataobj => {
        return dataobj.total_results;
      }).reduce((acc, curr) => acc + curr);
      this.setState({ results, loadingEvents: false, total_results });
    });
  }

  setLibcal(libcal, force=false, page=1, pageSize=20) {

    const maxPG = 20 * (Object.entries(LIBCAL).length - 1);
    if (libcal === 'All' && pageSize < maxPG) {
      pageSize = maxPG;
      console.log('custom page size of ', maxPG);
    }

    this.setState({libcal, force, loadingEvents: true, page, pageSize});
    if (libcal === 'All') {
      return this.setAllEvents(page, pageSize);
    }
    if (!LIBCAL.hasOwnProperty(libcal)) {
      return console.warn('incorrect select');
    }

    this.getEvents(libcal, pageSize, page).then(data => {
      const results = this.parseLibcalData(data);
      const total_results = data.total_results;
      this.setState({ results, loadingEvents: false, total_results });
    });
  }

  dateToStr(date) {
    return date.toDateString() + ', ' + date.toLocaleTimeString();
  }

  planReservering = event => {
    const event_id = event.id;
    console.log('reserveren, id=', event_id, 'libcal', event.libcal_name);
    if (!LIBCAL.hasOwnProperty(event.libcal_name)) {
      return console.warn('invalid libacal');
    }
    const libcal = LIBCAL[event.libcal_name];
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
      ...libcal
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
    this.setState({libcal:name});
    localStorage.setItem('libcal', name);
    this.setLibcal(name, this.state.force, 1);
  }

  onPaginate(page, pageSize) {
    console.log('onPaginate. page=',page, 'pageSize=',pageSize);
    this.setLibcal(this.state.libcal, this.state.force, page, pageSize);
  }

  render() {
    let res = this.state.results || [];
    res = res.map(result => {
                const trigger = this.state.triggers.includes(String(result.id));
                const booked = this.state.reservations.includes(String(result.id)) ||
                                trigger;
                return {
                  trigger,
                  booked,
                  ...result
                };
              })
              .filter(result => this.state.filtered ? result.booked : true);
      res.sort((a, b) => a.startdt_m - b.startdt_m)

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
        <Select value={this.state.libcal} style={{ width: 150 }}
          onChange={e => this.changeLibcal(e)}>
          {Object.entries(LIBCAL).map(entry => {
            const name = entry[0];
            return (
              <Option value={name}>{name}</Option>
            );
          })}
          <Option value="All">All</Option>
        </Select>
        <Pagination 
          style={{margin: '20px 10px'}}
          onChange={(page, pageSize) => this.onPaginate(page, pageSize)}
          current={this.state.page}
          pageSize={this.state.pageSize}
          defaultPageSize={20}
          showSizeChanger={this.state.libcal !== 'All'}
          pageSizeOptions={[20, 50, 
            20 * (Object.entries(LIBCAL).length - 1)
          ]}
          total={this.state.total_results} />
        <div style={{margin:'30px',
          display:'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(330px,1fr))',
          gridGap: '40px'
        }}>
          {
            this.state.loadingEvents ? 
              <>
                <Card loading={true} style={{ width: 320 }} />
                <Card loading={true} style={{ width: 320 }} />
                <Card loading={true} style={{ width: 320 }} />
                <Card loading={true} style={{ width: 320 }} />
                <Card loading={true} style={{ width: 320 }} />
                <Card loading={true} style={{ width: 320 }} />
                <Card loading={true} style={{ width: 320 }} />
              </>
            :
            (res.length === 0 ? 
              <Empty />
              :
            res.map(result => <StudySlot key={result.id}
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
            )
          }
        </div>
      </div>
    );
  }
}

export default App;
