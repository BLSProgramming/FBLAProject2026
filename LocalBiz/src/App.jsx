import { HashRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Login } from "./Pages/login";
import { Layout } from "./Layout";
import { UserRegister } from "./Pages/userRegister";
import { BusinessRegister } from "./Pages/businessRegister";
import Dashboard from "./Pages/dashboard";
import RequireAuth from "./Components/RequireAuth";
import { UserSettings } from "./Pages/userSettings";
import { ManageBusiness } from "./Pages/manageBusiness";
import ManageOffers  from "./Pages/manageOffers";
import CardPage from "./Pages/cardInfo";
import CardReviews from "./Pages/cardReviews";
import CardOffers from "./Pages/cardOffers";
import CardImages from "./Pages/cardImages";
import ManageReviews from "./Pages/manageReviews";
import ManageImages from "./Pages/manageImages";
import CardsList from "./Pages/cardsList";

function App() {
  return (
    <Router>
      <Routes>
        <Route index element={<Login />} />
        <Route path="login" element={<Login />} />
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
