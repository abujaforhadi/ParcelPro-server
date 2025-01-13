import React from 'react';
import Navbar from '../Components/Navbar';
import { Outlet } from 'react-router-dom';
import Footer from '../Components/Footer';

const MainLayouts = () => {
    return (
        <div>
            <Navbar/>
            <div className="container"> 
                <Outlet/>
            </div>
            <Footer/>
            
        </div>
    );
};

export default MainLayouts;