import { NavV2 } from '../components/NavV2';
import { HeroV2 } from '../sections/HeroV2';
import { ProblemV2 } from '../sections/ProblemV2';

export function LandingV2() {
  return (
    <div className="min-h-screen bg-white font-body text-black antialiased">
      <NavV2 />
      <HeroV2 />
      <ProblemV2 />
    </div>
  );
}
