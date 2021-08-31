export const getTemplate = async(template, data = {}, opts) => {
    const selection = {
      activate: fs
        .readFileSync(
          path.join(process.cwd(), "/Utils/Email.Provider/activate.ejs")
        ).toString(),
      forgotpassword: fs
        .readFileSync(
          path.join(process.cwd(), "/Utils/Email.Provider/forgotpassword.ejs")
        ).toString(),
      changePassword: fs
        .readFileSync(
          path.join(process.cwd(), "/Utils/Email.Provider/changepassword.ejs")
        ).toString()
    };
    const acceptedType = ["activate", "forgotpassword", "changePassword"];
    if (!acceptedType.includes(template))
      throw new Error(
        `Unknown email template type expected one of ${acceptedType} but got ${template}`
      );
    const html = ejs.compile(selection[template], opts || {})(data);
    return await inlineCss(html, {
      applyStyleTags: false,
      applyTableAttributes: true,
      removeHtmlSelectors: true,
      url: "http://localhost:3000/",
    });
  }