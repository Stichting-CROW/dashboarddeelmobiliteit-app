import React, { useState } from 'react';

const Login = () => {
  const [emailaddress, setEmailaddress] = useState('');
  const [password, setPassword] = useState('');
  const [recoverPassword, setRecoverPassword] = useState(false);

  const login = e => {
    e.preventDefault();

    console.log("login user %s with password %s", emailaddress, password);
    // do login here
  };
  
  const recover = e => {
    e.preventDefault();

    console.log("recover password for %s", emailaddress);
    // do login here
  };

  const renderLogin = () => {
    return (
      <div class="flex items-center justify-center min-h-screen bg-gray-100">
        <div class="px-8 py-6 mt-4 text-left bg-white shadow-lg">
          <h3 class="text-2xl font-bold text-center">Login to your account</h3>
          <form>
            <label className="block" htmlFor="emailaddress">Email Address</label>
            <input
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              autoCapitalize="off"
              placeholder="Email Address"
              name="emailaddress"
              required
              onChange={e => setEmailaddress(e.target.value)}
            />

            <label class="block" htmlFor="password">Password</label>
            <input
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              type="password"
              placeholder="Password"
              name="password"
              required
              onChange={e => setPassword(e.target.value)}
            />
          
            <div class="flex items-baseline justify-between">
                <button class="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900" onClick={login}>Login</button>
                <button class="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900" onClick={()=>setRecoverPassword(true)}>Forgot password</button>
            </div>
          </form>
        </div>
      </div>)
  }
  
  const renderRecoverPassword = () => {
    return (
      <div class="flex items-center justify-center min-h-screen bg-gray-100">
        <div class="px-8 py-6 mt-4 text-left bg-white shadow-lg">
          <h3 class="text-2xl font-bold text-center">Recover your password</h3>
          <form>
            <label className="block" htmlFor="emailaddress">Email Address</label>
            <input
              className="w-full px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              autoCapitalize="off"
              placeholder="Email Address"
              name="emailaddress"
              required
              onChange={e => setEmailaddress(e.target.value)}
            />
          
            <div class="flex items-baseline justify-between">
                <button class="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900" onClick={login}>Recover</button>
                <button class="px-6 py-2 mt-4 text-white bg-blue-600 rounded-lg hover:bg-blue-900" onClick={()=>setRecoverPassword(false)}>Cancel</button>
            </div>
          </form>
        </div>
      </div>)
  }
  
  return recoverPassword ? renderRecoverPassword() : renderLogin();
};

export default Login;