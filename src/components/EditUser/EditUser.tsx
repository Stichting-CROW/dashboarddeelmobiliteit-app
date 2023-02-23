import React, { useState } from 'react'
import Button from '../Button/Button'
import {
  useSelector
} from 'react-redux';
import { useParams } from 'react-router';
import { useLocation, useNavigate } from "react-router-dom";

import {StateType} from '../../types/StateType';

// Styles
import './EditUser.css'; 

// Components
import H5Title from '../H5Title/H5Title';

function EditUser({
  user
}: {
  user: object
}) {
  // Get userId from URL
  const { username } = useParams();

  // Init navigation class, so we can easily redirect using navigate('/path')
  const navigate = useNavigate();

  // Get API token
  const token = useSelector((state: StateType) => (state.authentication.user_data && state.authentication.user_data.token)||null)

  const handleSubmit = (event: object) => {
  }
  
  function getHeaders() {
    return {
      headers: {
        "Authorization":  `Bearer ${token}`
      }
    };
  }
  
  const handleClose = () => {
    navigate('/admin/users');
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-200">

      <p className="my-2">
        Hello {username}
      </p>

      <p className="my-2">
        [edit form]
      </p>

    </form>
  )
}

export default EditUser
