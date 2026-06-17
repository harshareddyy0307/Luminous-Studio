import { useState } from 'react';
import { FiPlus, FiMinus } from 'react-icons/fi';
import './FAQ.css';

const FAQS = [
  {
    question: 'How long does it take to deliver the edited photos?',
    answer: 'Standard portrait and event galleries are delivered within 7 to 10 days. Wedding packages with complete albums take 3 to 4 weeks, as we meticulously retouch each image to meet our premium standards.'
  },
  {
    question: 'Do you offer drone photography or aerial videography?',
    answer: 'Yes! High-resolution drone coverage is included for free in our Wedding Cinematic Video and Wedding Photography packages. It can also be added as a custom add-on for corporate events.'
  },
  {
    question: 'What is your payment and booking schedule?',
    answer: 'We require a 20% advance payment to reserve your event date. The remaining 80% is payable on the day of the shoot or immediately after final photo/video proofing.'
  },
  {
    question: 'Do we get raw, unedited photos?',
    answer: 'We deliver only our fully edited, print-ready digital images to ensure the quality matches our portfolio style. However, if raw files are explicitly required for corporate or commercial reasons, they can be purchased separately.'
  },
  {
    question: 'Can we customize the services in a package?',
    answer: 'Absolutely! Our catalog serves as a standard pricing guideline. You can customize details (e.g., adding hours, additional printed photo albums, or a second videographer) on request.'
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className="faq section-sm">
      <div className="container container-sm">
        <div className="text-center" style={{ marginBottom: '40px' }}>
          <span className="section-label">FAQ</span>
          <h2 className="display-sm font-heading">Frequently Asked Questions</h2>
          <p className="text-silver" style={{ marginTop: '8px' }}>Got questions? We have answers</p>
        </div>

        <div className="faq__list">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className={`faq__item ${isOpen ? 'faq__item--open' : ''} glass-card`}>
                <button className="faq__question" onClick={() => toggle(i)}>
                  <span>{faq.question}</span>
                  <span className="faq__icon">
                    {isOpen ? <FiMinus size={16} /> : <FiPlus size={16} />}
                  </span>
                </button>
                <div className="faq__answer-wrap">
                  <div className="faq__answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQ;