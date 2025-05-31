"use client"
import Image from 'next/image';
import Link from 'next/link';
import { FeaturesData } from '@/app/api/data';
import { Icon } from "@iconify/react";

const Treatments = () => {
    return (
        <section className='bg-primary'>
            <div className='container mx-auto lg:max-w-screen-xl md:max-w-screen-md p-4 md:p-0' id="about-section">
                <div className='text-center mb-14' >
                    <p className='text-white text-lg font-normal mb-3 tracking-widest uppercase'>Treatments</p>
                    <h2 className='text-3xl lg:text-5xl font-semibold text-white lg:max-w-60% mx-auto'>Check out our treatments!</h2>
                </div>
                <div className='grid sm:grid-cols-2 lg:grid-cols-4 gap-y-[2rem] gap-x-5 mt-16'>
                    {FeaturesData.map((items, i) => (
                        <div className='p-8 relative rounded-3xl bg-gray-50' key={i}>
                            <div className='work-img-bg rounded-full flex justify-center -top-[20%] sm:top-[-40%] md:top-[-55%] lg:top-[-25%] left-[36%]'>
                                <Image src={items.imgSrc} alt={items.imgSrc} width={150} height={10} className='rounded-full' />
                            </div>
                            <h3 className='text-2xl text-black  font-semibold text-center mt-4'>{items.heading}</h3>
                            <p className='text-lg font-normal text-black/50  text-center mt-2'>{items.subheading}</p>
                            <div className='flex items-center justify-center '>
                                <Link href='/' className='text-center text-lg group duration-300 ease-in-out font-medium text-primary mt-2 overflow-hidden flex items-center relative after:absolute after:w-full after:h-px after:bg-primary after:bottom-0 after:right-0 after:translate-x-full hover:after:translate-x-0'>
                                    Learn More
                                    <Icon
                                        icon="tabler:chevron-right"
                                        width="24"
                                        height="24"
                                        className="text-primary "
                                    />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Treatments;
