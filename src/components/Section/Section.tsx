import {useState, useEffect} from 'react';
import {motion} from 'framer-motion'
import { useNavigate } from "react-router-dom";

const variants: any = {
  open: {
    opacity: 1,
    // x: 0,
    maxHeight: '9999px',
    transition: 'easeOut',
    paddingTop: '1.0rem',
    paddingBottom: '1.0rem',
    duration: 0.3
  },
  closed: {
    opacity: 0,
    // y: "-100%",
    maxHeight: '0px',
    transition: 'easeOut',
    paddingTop: 0,
    paddingBottom: 0,
    duration: 0.3
  },
}

function Section({
  title,
  children,
  path,
  open
}: {
  title: string,
  children: any,
  path?: string,
  open?: boolean
}) {
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(open || false)

  return <section className="
    my-0 py-2
    border-b
    border-solid border-gray-200
  " style={{
    maxWidth: '100%',
  }}
  >
    <motion.h3 className="
      mt-4 mb-4
      text-xl font-bold
      cursor-pointer
    " onClick={() => {
      setIsOpen(! isOpen);
      // if(! isOpen) {
      //   navigate(path ? `/faq/${path}` : `/faq`);
      // } else {
      //   navigate(`/faq`);
      // }
    }}
    whileHover={{ textDecoration: 'underline' }}
    whileTap={{ scale: 0.98 }}
    >
      {title}
    </motion.h3>
    <motion.div
      animate={isOpen ? 'open' : 'closed'}
      variants={variants}
      className="overflow-y-hidden" 
     >
      {children}
    </motion.div>
  </section>
}

export default Section;
