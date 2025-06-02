import { LogoSVG } from '@/components/Common/LogoSVG';
import Link from 'next/link';

const Logo: React.FC = () => {

  return (
    <Link href="/" className='flex items-center text-white text-2xl font-semibold gap-4'>
      {/* Cute Nails & Beauty */}
      <LogoSVG height={42} />
    </Link>
  );
};

export default Logo;
