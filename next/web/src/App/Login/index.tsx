import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Redirect } from 'react-router-dom';

import { auth } from 'leancloud';
import Button from 'components/Button';

interface LoginFormData {
  username: string;
  password: string;
}

export default function Login() {
  const { register, handleSubmit } = useForm<LoginFormData>();
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = handleSubmit((data) => {
    setLoading(true);
    auth
      .login(data.username, data.password)
      .then(() => location.reload())
      .catch((error) => {
        console.error(error);
        setErrorMessage(error.message);
        setLoading(false);
      });
  });

  if (auth.currentUser) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex h-full">
      <div className="w-64 m-auto">
        <form onSubmit={onSubmit}>
          <div className="flex flex-col">
            <label>Username</label>
            <input
              className="px-2 py-1 border border-primary rounded outline-none focus:ring-1 ring-primary"
              {...register('username', { required: true })}
            />
          </div>

          <div className="flex flex-col mt-2">
            <label>Password</label>
            <input
              className="px-2 py-1 border border-primary rounded outline-none focus:ring-1 ring-primary"
              type="password"
              {...register('password', { required: true })}
            />
          </div>

          <Button className="w-full mt-4" type="submit" variant="primary" disabled={loading}>
            Sign in
          </Button>
        </form>

        {errorMessage && <p className="w-full mt-2 text-red-500 overflow-hidden">{errorMessage}</p>}
      </div>
    </div>
  );
}
