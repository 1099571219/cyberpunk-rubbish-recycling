import Pause from '@/components/pause/Pause';
import ThreeComp from './components/three/Three';

function Home() {
  return (
    <div className='relative h-100vmin w-100vmax bg-red'>
        <Pause />
        <ThreeComp />
    </div>
  );
}

export default Home;