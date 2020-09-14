import { CloseCircleOutlined, EditOutlined, UserOutlined, BellOutlined, LogoutOutlined, UserAddOutlined, LoginOutlined, CheckOutlined } from '@ant-design/icons';
import { Dropdown, Avatar, Badge, Button, Card, Input, Tooltip, Menu,message, Form, Modal } from 'antd';
import 'antd/dist/antd.css';
import $ from 'jquery';
import React from 'react';
import './App.css';

class StudySlot extends React.Component {
  render() {
    const result = this.props.slotinfo;
    const account = this.props.account;
    const booked = this.props.booked;
    const trigger = this.props.trigger;

    const regmsg = result.registration_msg;
    const fully_booked = regmsg && regmsg.msg.includes('fully booked');
    const not_open = regmsg && regmsg.msg.includes('Registrations open at');
    return (
      <Card
        key={result.id}
        title={result.date}
        extra={
          <>
            {fully_booked &&
              <Tooltip title={result.registration_msg.msg}>
                <Badge count={0} showZero>
                </Badge>
              </Tooltip>
            }
            {not_open &&
              <Tooltip title={result.registration_msg.msg}>
                <Badge count={90}
                  className="site-badge-count-4">
                </Badge>
              </Tooltip>
            }
            <Tooltip title={result.seatsleft_text}>
              <Badge count={result.seatsleft}
                style={{ backgroundColor: '#52c41a' }}>
              </Badge>
            </Tooltip>
          </>
        }
        style={{ width: 400, margin: '10px' }}
        actions={[
          <Button
            type="default"
            icon={booked ? 
              (trigger ? <BellOutlined key="trigger" /> :
                <CheckOutlined key="booked" />) :
              (result.registration_enabled ?
              <EditOutlined key="edit" /> :
              <BellOutlined key="schedule" />)}
            onClick={() => this.props.planReservering(result)}
            disabled={!account || fully_booked || booked}
            />,
            <>{trigger &&
              <Button 
                  type="default"
                  icon={<CloseCircleOutlined />}

              />}
            </>
        ]}>
        {result.title}
      </Card>
    )
  }
}

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

    const email = localStorage.getItem('email');
    if (email) this.identify(email).then(() => {
      return this.setReservations();
    })
  }

  constructPostForm(json) {
    var formBody = [];
    for (var property in json) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(json[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");

    return{
      method: 'post',
      headers: {
          'Accept': '*/*',
          'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formBody
    };
  }

  identify(email) {
    return fetch('http://35.228.177.55:3001/identify/', this.constructPostForm({email}))
    .then(response => response.json())
    .then(result => {
        if (result) {
          message.success('Logged into '+email);
          this.setState({account:result, email})
          localStorage.setItem('email', email);
        } else message.warn('Invalid login for '+email)
    })
    .catch (error => console.log('Request failed', error));   
  }

  login(email) {
    return this.identify(email).then(() => this.setState({loginVisible: false}));
  }

  registerAccount(user) {
    this.setState({registerLoading: true})
    return fetch('http://35.228.177.55:3001/register_account/', this.constructPostForm(user))
    .then(response => response.json())
    .then(result => {
      this.setState({registerLoading:false, registerVisible: false });
      return this.identify(user['formData[email]']);
    })
    .catch (error => console.log('Request failed', error));   
  }

  handleClick = e => {
    console.log('click ', e);
    switch (e.key) {
      case 'logout':
        localStorage.removeItem('email');
        this.setState({account:null})
        message.success('Logged out');
        break;
      case 'login':
        this.setState({loginVisible: true})
        break;
      case 'register_account':
        this.setState({registerVisible: true})
        break;
      default:
        console.warn('no action');
        break;
    }
  }

  planReservering = event => {
    const event_id = event.id;
    console.log('reserveren', event_id);
    const startdt = event.startdt;
    const regmsg = event.registration_msg;
    const fully_booked = regmsg && regmsg.msg.includes('fully booked');
    const not_open = regmsg && regmsg.msg.includes('Registrations open at');
    fetch('http://35.228.177.55:3001/register/', this.constructPostForm({
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
    fetch('http://35.228.177.55:3001/reservations/', this.constructPostForm({
        email: this.state.email
    }))
    .then(response => response.json())
    .then(data => {
      const triggers = data.triggers;
      const reservations = data.reservations.concat(triggers);
      this.setState({ reservations, triggers });
    })
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <p>UB reserveertool</p>
          <div>
            <Dropdown overlay={
              <Menu onClick={this.handleClick}>
                {this.state.account && 
                  <Menu.Item key="logout" icon={<LogoutOutlined />}>Logout</Menu.Item>}
                {!this.state.account && 
                  <Menu.Item key="register_account" icon={<UserAddOutlined />}>Register</Menu.Item>}
                {!this.state.account && 
                  <Menu.Item key="login" icon={<LoginOutlined />}>Login</Menu.Item>}
              </Menu>
            } trigger={['click']}>
              <Button type='primary' icon={<Avatar size="small" icon={<UserOutlined />} />}
                style={{background: 'none', border: 'none'}}>
                {this.state.account ? 
                  <>&nbsp;{this.state.account.fname}&nbsp;{this.state.account.lname}</>
                  : <></>}
              </Button>
            </Dropdown>
            <Modal title="Login" visible={this.state.loginVisible}
              onCancel={() => this.setState({ loginVisible: false })}
              footer={[]}>
              <Input prefix={<UserOutlined />} placeholder="RUG email"
                onPressEnter={(e) => this.login(e.target.value)}
                style={{width: 250}} />
            </Modal>
            <Modal title="Register" visible={this.state.registerVisible}
              onCancel={() => this.setState({ registerVisible: false })}
              footer={[]} onOk={(user) => this.registerAccount(user)}>
              <Form name="registration" onFinish={(user) => {
                this.registerAccount(user)
              }}>
                <Form.Item name={['formData[fname]']} label="First Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['formData[lname]']} label="Last Name" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['formData[email]']} label="Email" rules={[{ type: 'email', required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['formData[phone]']} label="Phone Number" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item name={['formData[q1]']} label="S- or P-number" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={
                    this.state.registerLoading
                  }>
                    Submit
                  </Button>
                </Form.Item>
              </Form>
            </Modal>
          </div>
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
