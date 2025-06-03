'use client';
import Image from 'next/image';

const Contact = () => {
    return (
        <section className="bg-gray-50 py-16" id="contact-section">
            <div className="container mx-auto px-4 lg:max-w-screen-xl md:max-w-screen-md">
                
                {/* Header */}
                <div className="text-center mb-10">
                    <p className="text-primary text-lg tracking-widest uppercase mb-2">
                        Contact Us
                    </p>
                    <h2 className="text-black font-bold text-4xl">Find Us</h2>
                </div>

                {/* Flex container: Map and Info side by side */}
                <div className="flex flex-col lg:flex-row gap-16 items-start">
                    
                    {/* Map */}
                    <div className="w-full lg:w-1/2 h-[32rem] rounded-lg overflow-hidden shadow-md">
                        <iframe
                            src="https://storage.googleapis.com/maps-solutions-eua9mygo9z/locator-plus/655z/locator-plus.html"
                            width="100%"
                            height="100%"
                            className="border-0"
                            loading="lazy"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>

                    {/* Contact Info */}
                    <div className="w-full lg:w-1/2 space-y-10">
                        <div>
                            <h3 className="text-black font-semibold text-3xl mb-4">Contact Details</h3>
                            <p className="text-lg text-gray-700">
                                Phone:{' '}
                                <a href="tel:07956044691" className="text-primary hover:underline">
                                    0795 6044 691
                                </a>
                            </p>
                        </div>

                        <div>
                            <h3 className="text-black font-semibold text-3xl mb-4">Opening Hours</h3>
                            <ul className="text-lg text-gray-700 space-y-2">
                                <li>Monday – Friday: 10:00 AM – 5:30 PM</li>
                                <li>Saturday: 10:00 AM – 6:30 PM</li>
                                <li>Sunday: Closed</li>
                            </ul>
                            <p className="text-sm text-gray-500 mt-4">
                                *Opening hours are subject to change. Please check Google for the latest updates.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
