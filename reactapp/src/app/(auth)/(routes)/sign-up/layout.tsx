import React, { Children } from "react";

const AuthLayout = ({children}: {children: React.ReactNode}) => {
    return (
        <section className='w-full bg-[#111827]'>
            <div className='h-screen flex items-center justify-center'>
                {children}
            </div>
        </section>
    );
};

export default AuthLayout;
