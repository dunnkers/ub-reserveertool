import { UserOutlined,
    LogoutOutlined,
    UserAddOutlined,
    LoginOutlined } from '@ant-design/icons';
import { Button, Input, Menu, message, Form, Modal } from 'antd';
import React, { createRef } from 'react';
import { constructPostForm } from './util'; 
const { SubMenu } = Menu;

export default class Account extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          registerVisible: false,
          loginVisible: false,
          loginValue: ''
        };
    }

    componentDidMount() {
        const email = localStorage.getItem('email');
        if (email) this.identify(email);
    }

    identify(email) {
        return fetch('http://35.228.177.55:3001/identify/', constructPostForm({email}))
        .then(response => response.json())
        .then(result => {
            if (result) {
              const localst_email = localStorage.getItem('email');
              if (!localst_email) message.success('Logged into '+email);
              localStorage.setItem('email', email);
              const accinfo = { account:result, email };
              this.setState(accinfo);
              this.props.setAccount(accinfo);
            } else message.warn('Invalid login for '+email)
            return result;
        })
        .catch (error => console.log('Request failed', error))
        .then(() => this.props.setReservations());
    }
    
    login(email) {
        return this.identify(email).then(() => this.setState({
            loginVisible: false
        }));
    }

    registerAccount(user) {
        this.setState({registerLoading: true})
        return fetch('http://35.228.177.55:3001/register_account/', constructPostForm(user))
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

    doStateChange(state) {
      this.setState(state);
    }

    render() {
      let loginValue = createRef();
        return (
          <>
          <Modal title="Login" visible={this.state.loginVisible}
            onCancel={() => this.setState({ loginVisible: false })}
            footer={[]}
            // width={300}
            >
            <Input prefix={<UserOutlined />} placeholder="RUG email"
              onPressEnter={(e) => this.login(e.target.value)}
              ref={loginValue}
              style={{width: 250}} />
            <Button type="primary" onClick={() => {
              this.login(loginValue.current.input.value)
            }
              }>
              Login
            </Button>
          </Modal>
          <Modal title="Register" visible={this.state.registerVisible}
            onCancel={(e) => {
              this.setState({ registerVisible: false })
            }}
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
          <Menu theme="dark" mode="horizontal">
            <SubMenu style={{float:'right'}}
              key="sub1"
              icon={<UserOutlined />}
              title={this.state.account ? 
                `${this.state.account.fname} ${this.state.account.lname}` : ''}
              onClick={this.handleClick}>
              {this.state.account && 
                <Menu.Item key="logout" icon={<LogoutOutlined />}>Logout</Menu.Item>}
              {!this.state.account && 
                <Menu.Item key="register_account" icon={<UserAddOutlined />}>Register</Menu.Item>}
              {!this.state.account && 
                <Menu.Item key="login" icon={<LoginOutlined />}>Login</Menu.Item>}
            </SubMenu>
          </Menu>
        </>
        );
    }
}