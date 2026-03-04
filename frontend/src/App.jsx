import { lazy, Suspense } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./Layout";
import RequireAuth from "./Components/RequireAuth";

// Route-level code splitting
const Landing          = lazy(() => import("./Pages/Landing").then(m => ({ default: m.Landing })));
const Login            = lazy(() => import("./Pages/login").then(m => ({ default: m.Login })));
const Contact          = lazy(() => import("./Pages/Contact"));
const UserRegister     = lazy(() => import("./Pages/UserRegister").then(m => ({ default: m.UserRegister })));
const BusinessRegister = lazy(() => import("./Pages/BusinessRegister").then(m => ({ default: m.BusinessRegister })));
const Dashboard        = lazy(() => import("./Pages/dashboard"));
const UserSettings     = lazy(() => import("./Pages/userSettings").then(m => ({ default: m.UserSettings })));
const ManageBusiness   = lazy(() => import("./Pages/manageBusiness").then(m => ({ default: m.ManageBusiness })));
const ManageOffers     = lazy(() => import("./Pages/manageOffers"));
const ManageReviews    = lazy(() => import("./Pages/manageReviews"));
const ManageImages     = lazy(() => import("./Pages/manageImages"));
const CardPage         = lazy(() => import("./Pages/cardInfo"));
const CardReviews      = lazy(() => import("./Pages/cardReviews"));
const CardOffers       = lazy(() => import("./Pages/cardOffers"));
const CardImages       = lazy(() => import("./Pages/cardImages"));
const CardsList        = lazy(() => import("./Pages/CardsList"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </Router>
  );
}

export default App;
