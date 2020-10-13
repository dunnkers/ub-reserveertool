import React from 'react';
import { Calendar, Badge } from 'antd';
import moment from 'moment';
import $ from 'jquery';
import { constructPostForm } from './util'; 
import 'moment/locale/nl';

export default class BookingPage extends React.Component {
    state = {
        value: moment(new Date()),
        selectedValue: moment(new Date()),
        reservations: []
    };

    componentDidMount() {
      $.ajax({
        url: 'https://libcal.rug.nl/ajax/calendar/list?c=7564&date=0000-00-00&perpage=96&page=1&audience=undefined&cats=&camps=&inc=0',
        dataType: 'jsonp'
      })
      .done((data) => this.setState({...data }));
    }

    setReservations = () => {
        fetch('http://35.228.177.55:3001/reservations/', constructPostForm({
            email: this.props.email
        }))
        .then(response => response.json())
        .then(data => {
            const triggers = data.triggers;
            const reservations = data.reservations.concat(triggers);
            const startdts = data.startdts;
            this.setState({ reservations, triggers, startdts });
        })
    }

    componentDidUpdate() {
        if (this.props.email !== this.state.email) {
            this.setState({email: this.props.email});
            this.setReservations();
        }
    }
    
    onSelect = value => {
        this.setState({
            value,
            selectedValue: value,
        });
    };

    onPanelChange = value => {
        this.setState({ value });
    };

    dateCellRender(date) {
        const { reservations, triggers, startdts } = this.state;
        const listData = [];
        for (let reservation of reservations) {
            if (!(reservation in startdts)) continue;
            let startdt = startdts[reservation];
            let eventdate = moment(startdt);
            
            if (!eventdate.isSame(date, 'day')) continue;

            const result = this.props.results.find(
                res => String(res.id) === reservation);
            if (!result) continue;
                
            const trigger = triggers.includes(String(reservation));
            listData.push({reservation, result, trigger});
        }

        return (
            <ul className="events">
                {listData.map(item => {
                    let location = item.result.location.replace(
                        'Reading room, ', '');
                    return (
                        <li key={item.reservation}>
                            <Badge status={
                                item.trigger ? "processing" : "success"
                            } text={item.result.start + ' ' + location} />
                        </li>
                    )
                })}
            </ul>
        );
    }
    

  render() {
    const { value } = this.state;
    return (
      <div style={{padding:'10px'}}>
          {/* Calendar doesn't update when this.reservations have been set. */}
          {/* fetch just the booking in LibCal corresponding to this month. */}
        <Calendar value={value}
            onSelect={this.onSelect}
            locale={moment.locale('nl')}
            dateCellRender={(e) => this.dateCellRender(e)}
            />
      </div>
    )
  }
}