import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { motion } from 'framer-motion';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 sm:p-12 bg-white dark:bg-gray-900">
                <div className="w-full max-w-md space-y-8">
                    <Head title="Log in" />

                    {/* Logo and Welcome Text */}
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                                Welcome Back
                            </h2>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                Sign in to your admin account
                            </p>
                        </motion.div>
                    </div>

                    {status && (
                        <div className="mb-4 p-4 rounded-lg bg-green-50 dark:bg-green-900">
                            <p className="text-sm font-medium text-green-600 dark:text-green-200">
                                {status}
                            </p>
                        </div>
                    )}

                    <motion.form
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        onSubmit={submit}
                        className="mt-8 space-y-6"
                    >
                        <div className="space-y-6 rounded-md shadow-sm">
                            {/* Email Input */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white"
                                        placeholder="admin@example.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                                )}
                            </div>

                            {/* Password Input */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember"
                                    name="remember"
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                    Remember me
                                </label>
                            </div>

                            {canResetPassword && (
                                <div className="text-sm">
                                    <Link
                                        href={route('password.request')}
                                        className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        Forgot your password?
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-900"
                            >
                                {processing ? 'Signing in...' : 'Sign in'}
                            </button>
                        </div>
                    </motion.form>
                </div>
            </div>

            {/* Right side - Decorative */}
            <div className="hidden lg:block relative flex-1 bg-gradient-to-br from-blue-600 to-blue-800">
                <div className="absolute inset-0 bg-pattern opacity-10"></div>
                <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="text-white max-w-lg text-center">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h1 className="text-4xl font-bold mb-6">Report Management System</h1>
                            <p className="text-lg opacity-90">
                                Streamline your reporting process with our powerful management dashboard
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
