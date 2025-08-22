import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom';
import AppHome from './pages/AppHome';
import CreateList from './pages/CreateList';
import ListView from './pages/ListView';
import CreateItem from './pages/CreateItem';
import ItemDetail from './pages/ItemDetail';


const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <HashRouter>
        <Routes>
            <Route path="/" element={<AppHome />} />
            <Route path="/create" element={<CreateList />} />
            <Route path="/list/:name" element={<ListView />} />
            <Route path="/create/:listName" element={<CreateItem />} />
            <Route path="/item/:listName/:itemId" element={<ItemDetail />} />
            <Route path="/create-list" element={<CreateList />} />
        </Routes>
    </HashRouter>
);
