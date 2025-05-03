import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { FiUsers, FiBook, FiHeart, FiMapPin } from 'react-icons/fi'
import { assets } from '../assets/assets'



const About = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  })

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <section id="about" className="section bg-gray-50" ref={ref}>
      <div className="container-custom">
        <motion.div 
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={fadeIn}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="section-title">
            About <span className="text-primary-600">The Quran Foundation</span>
          </h2>
          <p className="section-subtitle mx-auto">
            A legally registered non-profit organization headquartered in Hyderabad, India, 
            dedicated to transforming the lives of marginalized communities.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative">
              <img 
                src= {assets.about_image} 
                alt="The Quran Foundation volunteers" 
                className="rounded-lg shadow-lg object-cover h-[400px] w-full"
              />
              {/* Mission Statement Card */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-lg shadow-lg p-6 max-w-xs">
                <h3 className="text-xl font-bold text-primary-700 mb-2">Our Mission</h3>
                <p className="text-gray-700">
                  "The love for creation is proof of the love for the Creator."
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Transforming Lives Since 2010</h3>
            <p className="text-gray-700 mb-6">
              With a steadfast commitment to sincerity, dedication, and consistency, 
              The Quran Foundation focuses on fostering educational, social, and cultural advancement. 
              By collaborating with other NGOs, we unite efforts to catalyze positive societal change, 
              enhance livelihoods, and nurture intellects.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
              {[
                { icon: <FiUsers size={24} />, title: 'Community Focus', description: 'Working directly with marginalized communities' },
                { icon: <FiBook size={24} />, title: 'Educational Initiatives', description: 'Prioritizing education for sustainable change' },
                { icon: <FiHeart size={24} />, title: 'Compassionate Action', description: 'Serving with love and dedication' },
                { icon: <FiMapPin size={24} />, title: 'Local Impact', description: 'Creating change in Hyderabad slum areas' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, delay: 0.6 + (index * 0.1) }}
                  className="flex items-start"
                >
                  <div className="bg-primary-100 p-3 rounded-full text-primary-600 mr-4 flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default About