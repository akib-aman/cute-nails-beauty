"use client"
import Image from 'next/image';
import { galleryImages } from '@/app/api/data';
import Masonry from 'react-masonry-css';
import Link from 'next/link';

const Gallery = () => {
    return (
        <section className='bg-primary'>
            <div className='container mx-auto lg:max-w-screen-xl md:max-w-screen-md' id='gallery-section'>
                <div className="text-center">
                    <p className='text-white text-lg font-normal mb-3 tracking-widest uppercase'>Gallery</p>
                    <h2 className="text-3xl lg:text-5xl font-semibold text-white">
                        Quality is our priority
                    </h2>
                </div>
                <div className="my-16 px-6 grid-cols-2">
                    <Masonry
                        breakpointCols={{ 'default': 2, '700': 2, '500': 1 }}
                        className="flex gap-6"
                        columnClassName="masonry-column"
                    >
                        {/* Map through images */}
                        {galleryImages.map((item, index) => (
                            <div key={index} className="overflow-hidden rounded-3xl mb-6 relative group">
                                <Image
                                    src={item.src}
                                    alt={item.name}
                                    width={600}
                                    height={500}
                                    className="object-cover w-full h-full"
                                />
                                <div className="w-full h-full absolute bg-black/40 top-full group-hover:top-0 duration-500 p-6 flex flex-col items-start gap-2 justify-end">
                                    <p className='text-white text-2xl'>
                                        {item.name}
                                    </p>
                                    <div className="flex items-center justify-between w-full">
                                        <p className='text-white text-2xl'>
                                            <span className='font-semibold'>Price:</span> £{item.price}
                                        </p>
                                        <Link href="#treatments-section" className='text-white rounded-full bg-primary border border-primary py-2 px-6 hover:bg-primary/40 hover:backdrop-blur-sm'>
                                            Learn More
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Masonry>
                </div>
            </div>
        </section>
    );
}

export default Gallery;
