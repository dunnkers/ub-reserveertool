import { message } from 'antd';
import 'antd/dist/antd.css';
import $ from 'jquery';
import React from 'react';
import './App.css';
import StudySlot from './StudySlot';
import Account from './Account';
import { constructPostForm } from './util'; 

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {results: [],reservations:[],triggers:[]};
  }

  componentDidMount() {
    $.ajax({
      headers: {
        'SameSite': 'None'
      },
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
    fetch('http://35.228.177.55:3001/register/', constructPostForm({
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
    fetch('http://35.228.177.55:3001/reservations/', constructPostForm({
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
    fetch('http://35.228.177.55:3001/cancel_reservation/', constructPostForm({
        email: this.state.email,
        event_id
    }))
    .then(response => response.json())
    .then(() => {
      message.success('Cancelled event '+event_id);
      this.setReservations()
    }).catch(() => message.warn('Could not cancel event '+event_id));
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <p>UB reserveertool</p>
          <Account 
            setReservations={() => this.setReservations()}
            setAccount={accinfo => this.setState(accinfo)}
            />
        </header>
        <div style={{display:'flex'}}>
          <div style={{margin:'20px'}}>
            <h2>Make reservations</h2>
            {
              this.state.results.map(result => {
                const booked = this.state.reservations.includes(String(result.id)) ||
                               this.state.triggers.includes(String(result.id));
                if (booked) return <div key={result.id}></div>;
                return <StudySlot key={result.id}
                                  slotinfo={result}
                                  account={this.state.account}
                                  booked={booked}
                                  planReservering={
                                    (result) => this.planReservering(result)
                                  }/>
              })
            }
          </div>
          <div style={{margin:'20px'}}>
            <h2>My reservations</h2>
            {
              this.state.reservations.map(reservation => {
                const result = this.state.results.find(
                  res => String(res.id) === reservation);
                if (!result) {
                  console.warn('no slot found for ' + reservation);
                  return <div key={0}></div>;
                }

                const trigger = this.state.triggers.includes(String(result.id));
                const booked = this.state.reservations.includes(String(result.id)) ||
                                trigger;
                return <StudySlot key={result.id}
                                  cancelReservering={
                                    (result) => this.cancelReservation(result.id)
                                  }
                                  slotinfo={result} account={this.state.account}
                                  booked={booked} trigger={trigger}/>
              })
            }
          </div>
        </div>
      </div>
    );
  }
}

export default App;
