import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import SearchPage from "./pages/SearchPage";
import ResultsPage from "./pages/ResultsPage";
import PartDetailPage from "./pages/PartDetailPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<SearchPage />} />
        <Route path="/search" element={<ResultsPage />} />
        <Route path="/parts/:id" element={<PartDetailPage />} />
        <Route path="/upload" element={<UploadPage />} />
      </Route>
    </Routes>
  );
}
