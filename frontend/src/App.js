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
    $.ajax({
      url: 'https://libcal.rug.nl/ajax/calendar/list?c=7564&date=0000-00-00&perpage=96&page=1&audience=undefined&cats=&camps=&inc=0',
      dataType: 'jsonp'
    })
    .done((data) => this.setState({...data }))
  }

  planReservering = event => {
    const event_id = event.id;
    console.log('reserveren', event_id);
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
    .then(response => response.json())
    .catch (error => console.log('Request failed', error))
    .then(_ => {
      message.success('Made reservation for '+event_id);
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

  cancelReservation = event_id => {
    console.log(event_id); 
    fetch(`${BACKEND}/cancel_reservation/`, constructPostForm({
        email: this.state.email,
        event_id
    }))
    .then(response => response.json())
    .then(() => {
      message.success('Cancelled event '+event_id);
      this.setReservations()
    }).catch(() => message.warn('Could not cancel event '+event_id));
  }

  filter(e) {
    this.setState({ filtered: e.target.checked });
  }

  render() {
    return (
      <div className="App">
        <div className="logo">UB Reserveertool</div>
        <Account 
          setReservations={() => this.setReservations()}
          setAccount={accinfo => this.setState(accinfo)}
          style={{float:'right'}}
          loggedOut={() => this.setState(INIT_ACC_STATE)}
          />
        <h2 style={{marginTop: '10px' }}>Reservations</h2>
        <Checkbox onChange={e => this.filter(e)}>
          Show only my reservations
        </Checkbox>
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
                                        planReservering={
                                          (result) => this.planReservering(result)
                                        }
                                        cancelReservering={
                                          (result) => this.cancelReservation(result.id)
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
