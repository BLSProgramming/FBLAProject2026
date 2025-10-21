import React from 'react';
import { Navigate } from 'react-router-dom';

// cardsList used to be a public listing; the app now uses Dashboard for the public /cards route.
// Keep this file as a safety redirect for any stray imports or bookmarks.
export default function CardsList() {
  return <Navigate to="/cards" replace />;
}
