import Home from '../views/Home';

export const metadata = {
  title: 'Jyotish Stack AI — Ancient Wisdom. Modern Intelligence.',
};

export default function HomePage() {
  // lang is managed in providers; page renders without lang prop
  // (lang is passed via context or localStorage in client components)
  return <Home />;
}
