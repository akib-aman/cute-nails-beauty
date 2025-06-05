// index.tsx
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import {
  FeaturesData,
  TreatmentSections,
  TreatmentSection,
  Treatment,
  ChildTreatment,
} from '@/app/api/data';

const Treatments: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<TreatmentSection | null>(null);
  const [expandedParents, setExpandedParents] = useState<Record<number, boolean>>({});

  /** Called when “Learn More” is clicked */
  const handleLearnMore = (heading: string) => {
    const found = TreatmentSections.find((sec) => sec.title === heading) || null;
    setSelectedSection(found);
    setModalOpen(true);
    setExpandedParents({}); // reset any open dropdowns
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSection(null);
    setExpandedParents({});
  };

  const toggleParent = (idx: number) => {
    setExpandedParents((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <section className="bg-primary" id="treatments-section">
      {/* ← 1) RE-INSERT THIS GRID SO “Learn More” EXISTS → */}
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md p-4">
        <div className="text-center mb-14">
          <p className="text-white text-lg font-normal mb-3 tracking-widest uppercase">
            Treatments
          </p>
          <h2 className="text-3xl lg:text-5xl font-semibold text-white lg:max-w-60% mx-auto">
            Check out our treatments!
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-y-[5rem] sm:gap-y-[8rem] mt-[6rem] sm:mt-[10rem] gap-x-5">
          {FeaturesData.map((item, i) => (
            <div key={i} className="p-8 relative rounded-3xl bg-gray-50">
              {/* (Optional) Icon/image at top */}
              <div className="absolute work-img-bg rounded-full flex justify-center -top-[20%] sm:top-[-40%] md:top-[-30%] lg:top-[-25%] left-1/2 transform -translate-x-1/2">
                <Image
                  src={item.imgSrc}
                  alt={item.heading}
                  width={150}
                  height={150}
                  className="rounded-full"
                />
              </div>

              <h3 className="text-2xl text-black font-semibold text-center mt-20">
                {item.heading}
              </h3>
              <p className="text-lg font-normal text-black/50 text-center mt-2">
                {item.subheading}
              </p>

              <div className="flex items-center justify-center mt-4">
                <button
                  onClick={() => handleLearnMore(item.heading)}
                  className="
                    text-center text-lg group duration-300 ease-in-out font-medium text-primary
                    overflow-hidden flex items-center relative
                    after:absolute after:w-full after:h-px after:bg-primary after:bottom-0
                    after:right-0 after:translate-x-full hover:after:translate-x-0
                  "
                >
                  Learn More
                  <Icon
                    icon="tabler:chevron-right"
                    width="24"
                    height="24"
                    className="text-primary ml-2"
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ← 2) YOUR MODAL – this shows only if modalOpen && selectedSection */}
      {modalOpen && selectedSection && (
        <>
          {/* Dark overlay */}


          {/* Modal container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" >
            <div
              className="fixed inset-0 bg-black bg-opacity-60 z-40" onClick={closeModal}
            />
            
            <div
              className="
                bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto
                border-2 border-primary z-50
              "
            >
              {/* Header with title + close button */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200">
                <h2 className="text-2xl font-semibold text-primary">
                  {selectedSection.title}
                </h2>
                <button
                  onClick={closeModal}
                  aria-label="Close treatments modal"
                  className="text-gray-600 hover:text-primary"
                >
                  <Icon icon="mdi:close" width="28" height="28" />
                </button>
              </div>

              {/* Scrollable list of treatments */}
              <div className="p-4 space-y-4">
                {selectedSection.treatments.length === 0 ? (
                  <p className="text-center text-gray-500">
                    No treatments defined yet.
                  </p>
                ) : (
                  selectedSection.treatments.map((treat: Treatment, idx: number) => {
                    // If this treatment has multiple “children” (time/price options):
                    if (treat.children && treat.children.length > 0) {
                      const isOpen = !!expandedParents[idx];
                      return (
                        <div key={idx}>
                          {/* Parent row: name + chevron */}
                          <div
                            onClick={() => toggleParent(idx)}
                            className="
                              flex justify-between items-center bg-gray-50 p-3 rounded-md
                              hover:bg-gray-100 transition cursor-pointer
                            "
                          >
                            <span className="text-base font-medium text-gray-800 truncate">
                              {treat.name}
                            </span>
                            <Icon
                              icon={isOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'}
                              width="24"
                              height="24"
                              className="text-gray-600"
                            />
                          </div>

                          {/* Expanded children, if any */}
                          {isOpen && (
                            <div className="mt-2 space-y-2 pl-4">
                              {treat.children.map(
                                (child: ChildTreatment, cidx: number) => (
                                  <div
                                    key={cidx}
                                    className="
                                      grid grid-cols-[1fr_auto] grid-rows-2 gap-x-4 bg-gray-50 p-3 rounded-md
                                      hover:bg-gray-100 transition
                                    "
                                  >
                                    {/* Row 1: (blank) + time */}
                                    <span
                                      className="text-base text-gray-800 col-start-1 row-start-1"
                                    >
                                      {child.name}
                                    </span>
                                    <span
                                      className="
                                        text-base font-semibold text-primary
                                        col-span-2 text-right row-start-2
                                      "
                                    >
                                      {child.price}
                                    </span>

                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    // Otherwise, standalone treatment:
                    return (
                      <div
                        key={idx}
                        className="
                          grid grid-cols-[1fr_auto] grid-rows-2 gap-x-4 bg-gray-50 p-3 rounded-md
                          hover:bg-gray-100 transition
                        "
                      >
                        <span
                          className="
                            text-base font-medium text-gray-800 truncate
                            col-start-1 row-start-1
                          "
                        >
                          {treat.name}
                        </span>
                        <span
                          className="
                            text-sm text-gray-600 text-right
                            col-start-2 row-start-1
                          "
                        >
                          {treat.time}
                        </span>
                        <span
                          className="
                            text-base font-semibold text-primary
                            col-span-2 text-right 
                          "
                        >
                          {treat.price}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
};

export default Treatments;
