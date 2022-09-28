function Section({title, children}) {
  return <section className="my-6 py-2 border-t-2 border-solid border-gray-200" style={{
    maxWidth: '100%',
    // width: '320px',
  }}>
    <h3 className="mt-4 mb-4 text-xl font-bold">
      {title}
    </h3>
    {children}
  </section>
}

export default Section;
