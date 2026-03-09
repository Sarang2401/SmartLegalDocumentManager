import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { DocumentDetail } from './pages/DocumentDetail';
import { VersionCompare } from './pages/VersionCompare';

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/documents/:id" element={<DocumentDetail />} />
                    <Route path="/documents/:id/compare/:v1/:v2" element={<VersionCompare />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
