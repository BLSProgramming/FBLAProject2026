import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Login } from "./Pages/Login";
import { Landing } from "./Pages/Landing";
import Contact from "./Pages/Contact";
import { Layout } from "./Layout";
import { UserRegister } from "./Pages/UserRegister";
import { BusinessRegister } from "./Pages/BusinessRegister";
import Dashboard from "./Pages/Dashboard";
import RequireAuth from "./Components/RequireAuth";
import { UserSettings } from "./Pages/UserSettings";
import { ManageBusiness } from "./Pages/ManageBusiness";
import ManageOffers  from "./Pages/ManageOffers";
import CardPage from "./Pages/CardInfo";
import CardReviews from "./Pages/CardReviews";
import CardOffers from "./Pages/CardOffers";
import CardImages from "./Pages/CardImages";
import ManageReviews from "./Pages/ManageReviews";
import ManageImages from "./Pages/ManageImages";
import CardsList from "./Pages/CardsList";

function App() {
  return (
    <Router>
      <Routes>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="contact" element={<Contact />} />
        <Route path="userRegister" element={<UserRegister/>} />
        <Route path="businessRegister" element={<BusinessRegister/>} />
        <Route element={<Layout />}>
          <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="userSettings" element={<RequireAuth requiredUserType={'user'}><UserSettings /></RequireAuth>} />
          <Route path="manageBusiness" element={<RequireAuth requiredUserType={'business'}><ManageBusiness /></RequireAuth>} />
          <Route path="manageOffers" element={<RequireAuth requiredUserType={'business'}><ManageOffers /></RequireAuth>} />
          <Route path="manageReviews" element={<RequireAuth requiredUserType={'business'}><ManageReviews /></RequireAuth>} />
          <Route path="manageImages" element={<RequireAuth requiredUserType={'business'}><ManageImages/></RequireAuth>} />
          <Route path="cards" element={<CardsList />} />
          <Route path="cards/:slug" element={<RequireAuth><CardPage /></RequireAuth>} />
          <Route path="cards/:slug/reviews" element={<RequireAuth><CardReviews /></RequireAuth>} />
          <Route path="cards/:slug/deals" element={<RequireAuth><CardOffers /></RequireAuth>} />
          <Route path="cards/:slug/images" element={<RequireAuth><CardImages /></RequireAuth>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
