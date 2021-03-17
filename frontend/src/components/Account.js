import { UserOutlined,
    LogoutOutlined,
    UserAddOutlined,
    LoginOutlined } from '@ant-design/icons';
import { Button, Input, Menu, message, Form, Modal, Spin } from 'antd';
import React, { createRef } from 'react';
import { constructPostForm } from '../util/util'; 
import { BACKEND } from '../util/config';

const { SubMenu } = Menu;

export default class Account extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          updateVisible: false,
          loginVisible: false,
          registering: false,
          registrationForm: createRef(),
          loginValue: createRef(),
          loginLoading: false,
          identifying: false
        };
    }

    componentDidMount() {
        const email = localStorage.getItem('email');
        if (email) this.identify(email);
    }

    identify(email) {
      email = email.toLowerCase();
      this.setState({ identifying: true });
      return new Promise(resolve => {
        setTimeout(resolve, 5000);
      }).then(() => {

      return fetch(`${BACKEND}/identify`, constructPostForm({email}))
      .then(response => response.json())
      .then(result => {
          if (result) {
            const localst_email = localStorage.getItem('email');
            const name = result.fname ? ' as '+result.fname+' '+result.lname :'';
            if (!localst_email) message.success('Logged in' + name);
            localStorage.setItem('email', email);
            const accinfo = { account:result, email };
            this.setState(accinfo);
            this.props.setAccount(accinfo);
            if (this.state.loginValue.current) {
              this.state.loginValue.current.setValue('');
              this.state.registrationForm.current.setFieldsValue(result);
            }
          } else message.warn('Invalid login for '+email)
          return result;
      })
      .catch (error => console.log('Request failed', error))
      .then(() => {
        this.setState({ identifying: false });
        this.props.setReservations();
      });
    });
    }
    
    login(email) {
      this.setState({ loginLoading: true, loginVisible: false });
      if (email.startsWith('add_account:')) {
        email = email.replace('add_account:', '');
        console.log(`adding ${email} account...`);
        return fetch(`${BACKEND}/add_account`, constructPostForm({email}))
          .then(response => {
            console.log('account added:', response);
            return this.identify(email).then(() => {
              this.setState({ loginVisible: false, loginLoading: false });
            });
          });
      } else {
        return this.identify(email).then(() => {
          this.setState({ loginVisible: false, loginLoading: false });
        });
      }
    }

    updateAccount(user) {
      if (this.state.registering && 
        (!user || !user.secret || user.secret !== 'deubbot2021')) {
        message.warn('Invalid secret.');
        return;
      }
      if (user.secret) delete user.secret;

      user['email'] = user['email'].toLowerCase();
      this.setState({updateLoading: true});

      return fetch(`${BACKEND}/update_account`, constructPostForm(user))
        .then(response => response.json())
        .then(result => {
          this.setState({updateLoading:false, updateVisible: false, registering: false });
          return this.identify(user['email']);
        })
        .catch (error => console.log('Request failed', error));   
    }

    handleClick = e => {
        console.log('click ', e);
        switch (e.key) {
        case 'logout':
            localStorage.removeItem('email');
            this.setState({account:null})
            this.props.loggedOut();
            message.success('Logged out');
            if (this.state.registrationForm.current) {
              // `registrationForm` had this users' initialValues put in,
              // so we cannot reset to the intial values, but have to set
              // every field explicitly to undefined instead.
              this.state.registrationForm.current.setFieldsValue({
                fname: undefined,
                lname: undefined,
                email: undefined,
                phone: undefined,
                q1: undefined,
                secret: undefined
              });
            }
            break;
        case 'login':
            this.setState({loginVisible: true});
            break;
        case 'register':
            this.setState({updateVisible: true, registering: true});
            break;
        case 'update_account':
            this.setState({updateVisible: true});
            break;
        default:
            console.warn('no action');
            break;
        }
    }

    doStateChange(state) {
      this.setState(state);
    }

    render() {
        return (
          <>
          <Modal title="Login" visible={this.state.loginVisible}
            onCancel={() => this.setState({ loginVisible: false, loginLoading: false })}
            footer={[]}
            >
              <div style={{display:'flex'}}>
                <Input prefix={<UserOutlined />} placeholder="RUG email"
                  onPressEnter={(e) => this.login(e.target.value)}
                  autoFocus
                  disabled={this.state.loginLoading}
                  ref={this.state.loginValue}/>
                <Button type="primary" onClick={() => {
                  this.login(this.state.loginValue.current.input.value)
                }} loading={this.state.loginLoading}>Login</Button>
              </div>

              {this.state.loginLoading && 
                <Spin
                  tip="Logging in might take up to 15 seconds..."
                  spinning={true}
                  delay={300}>
                </Spin>
              }
          </Modal>
          <Modal
            title={this.state.registering ? "Registering new account"
              : "Update account info"}
            visible={this.state.updateVisible}
            onCancel={(e) => {
              this.setState({ updateVisible: false, registering: false })
            }}
            footer={[]} onOk={(user) => this.updateAccount(user)}>
            <Form name="registration" onFinish={(user) => {
              this.updateAccount(user)
            }}
              ref={this.state.registrationForm}
              initialValues={this.state.account || {}}>
              <Form.Item name={['fname']} label="First Name" rules={[{ required: true }]}>
                <Input autoFocus />
              </Form.Item>
              <Form.Item name={['lname']} label="Last Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name={['email']} label="Email" rules={[{ type: 'email', required: true }]}>
                <Input disabled={this.state.registering ? false : true} />
              </Form.Item>
              <Form.Item name={['phone']} label="Phone Number" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name={['q1']} label="S- or P-number" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              {this.state.registering && 
                <>
                  <br></br><br></br>
                  <Form.Item name={['secret']} label="Secret" rules={[{ required: true }]}>
                    <Input.Password />
                  </Form.Item>
                </>
              }
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={
                  this.state.updateLoading
                }>
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </Modal>
          <Spin
            tip="Logging in... might take up to 15 seconds..."
            spinning={this.state.identifying}
            delay={100}>
            <Menu theme="dark" mode="horizontal">
              <SubMenu style={{float:'right'}}
                key="sub1"
                icon={<UserOutlined />}
                title={this.state.account ? 
                  <>
                    <span className='account-fname'>{this.state.account.fname}</span>
                    &nbsp;
                    <span className='account-lname'>{this.state.account.lname}</span>
                  </>
                  : ''}
                onClick={this.handleClick}>
                {this.state.account && 
                  <Menu.Item key="update_account" icon={<UserAddOutlined />}>Edit info</Menu.Item>}
                {this.state.account && 
                  <Menu.Item key="logout" icon={<LogoutOutlined />}>Logout</Menu.Item>}
                {!this.state.account && 
                  <Menu.Item key="register" icon={<UserAddOutlined />}>Register</Menu.Item>}
                {!this.state.account && 
                  <Menu.Item key="login" icon={<LoginOutlined />}>Login</Menu.Item>}
              </SubMenu>
            </Menu>
          </Spin>
        </>
        );
    }
}