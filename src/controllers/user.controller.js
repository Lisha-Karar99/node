const User = require("../schema/user.schema");

module.exports.getUsersWithPostCount = async (req, res) => {
  try {
    //TODO: Implement this API

    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = limit * (page - 1);
    
    let pipeline = [
      {
        $facet: {
          totalUser: [
            {
              $match: { _id: { $exists: true } },
            },
          ],
          usersWithPost: [
            {
              $lookup: {
                from: "posts",
                localField: "_id",
                foreignField: "userId",
                as: "users",
              },
            },
            {
              $addFields: {
                posts: { $size: "$users" },
              },
            },
            {
              $skip: skip,
            },
            {
              $limit: limit,
            },
            {
              $project: {
                users: 0,
                __v: 0,
              },
            },
          ],
        },
      },
    ];

    let users = await User.aggregate(pipeline);

    let { totalUser, usersWithPost } = users[0];

    let totalPages = totalUser.length ? Math.ceil(totalUser.length / limit) : 0;

    let pagination = totalPages ? {
      totalDocs: totalUser.length,
      limit: limit,
      page: page,
      totalPages: totalPages,
      pagingCounter: skip + 1,
      hasPrevPage: page <= 1 ? false : true,
      hasNextPage: page >= totalPages ? false : true,
      prevPage: page <= 1 ? null : page - 1,
      nextPage: page >= totalPages ? null : page + 1,
    } : {};

    res.status(200).json({
      data: {
        users: usersWithPost,
        pagination: pagination,
      },
    });
  } catch (error) {
    res.send({ error: error.message });
  }
};
