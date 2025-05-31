"use client"
import Image from 'next/image';
import Link from 'next/link';


const Hero = () => {

    return (
        <section id="home-section" className='bg-gray-50'>
            <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4 pt-20">
                <div className='grid grid-cols-1 lg:grid-cols-12 items-center'>
                    <div className='col-span-6'>
                        <h1 className="text-4xl lg:text-7xl font-semibold mb-5 text-primary md:4px lg:text-start text-center">
                            Threading Nails & Beauty
                        </h1>
                        <p className='text-black lg:text-lg font-normal mb-10 lg:text-start text-center'>Cute is a beauty salon situated in Edinburgh that specializes in Eyebrow threading, waxing, nails and lashes.</p>
                        <div className='md:flex align-middle justify-center lg:justify-start'>
                            <Link href='#about-section' className='flex border w-full md:w-auto mt-5 md:mt-0 bg-primary border-primary justify-center rounded-full text-xl font-medium items-center py-5 px-10 text-white hover:text-primary hover:bg-white'>Book Now!</Link>
                        </div>
                    </div>
                    <div className='col-span-6 flex justify-center relative'>
                        <div className='flex bg-white p-2 gap-5 items-center bottom-2 right-2 rounded-xl absolute'>
                            <p className='text-lg text-black font-normal'>📍 32 Duart Crescent <br /> EH4 7JP</p>
                        </div>
                        <Image src="/images/hero/frontpage.jpg" alt="nothing" width={1500} height={1900} className='rounded-xl mt-10' />
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero;