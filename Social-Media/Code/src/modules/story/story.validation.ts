import z from "zod";
import { availabilityEnum } from "../../common/enum";
import { Types } from "mongoose";
import { generalValidationFields } from "../../common/validation";

export const creatStory = {
  body: z
    .strictObject({
      content: z.string().optional(),
      attachments: z
        .object({ image: z.array(z.any()), video: z.array(z.any()) })
        .optional(),
      tags: z.array(z.string()).optional(),
      mentions: z.array(z.string()).optional(),
      availability: z.coerce.number().default(availabilityEnum.PUBLIC),
    })
    .superRefine((args, ctx) => {
      if (!args.attachments && !args.content) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "Content is Required",
        });
      }
      if (args.mentions?.length) {
        for (const arg of args?.mentions) {
          if (!Types.ObjectId.isValid(arg)) {
            ctx.addIssue({
              code: "custom",
              path: ["mentions"],
              message: `Invalid Tagged ObjectId ${arg}`,
            });
          }
        }
        const uniqueMentions = [...new Set(args.mentions)];
        if (uniqueMentions.length != args.mentions.length) {
          ctx.addIssue({
            code: "custom",
            path: ["mentions"],
            message: "Dublicated mentions",
          });
        }
      }
    }),
};
export const updateStory = {
  params: z.strictObject({
    storyId: generalValidationFields.id,
  }),
  body: z
    .strictObject({
      content: z.string().trim().optional(),
      attachments: z
        .object({ image: z.array(z.any()), video: z.array(z.any()) })
        .optional(),
      tags: z.array(z.string()).optional(),
      mentions: z.array(z.string()).optional(),
      availability: z.coerce.number().default(availabilityEnum.PUBLIC),
    })
    .superRefine((args, ctx) => {
      if (!Object.values(args).length) {
        ctx.addIssue({
          code: "custom",
          message: "Can't accept all fields to be empty",
        });
      }
      if (args.mentions?.length) {
        for (const arg of args?.mentions) {
          if (!Types.ObjectId.isValid(arg)) {
            ctx.addIssue({
              code: "custom",
              path: ["mentions"],
              message: `Invalid Tagged ObjectId ${arg}`,
            });
          }
        }
        const uniqueMentions = [...new Set(args.mentions)];
        if (uniqueMentions.length != args.mentions.length) {
          ctx.addIssue({
            code: "custom",
            path: ["mentions"],
            message: "Dublicated mentions",
          });
        }
      }
    }),
};
export const getStory = {
  params: z.strictObject({
    storyId: generalValidationFields.id,
  }),
  query: z.strictObject({
    type: z.string().optional(),
  }),
};
export const deleteStory = {
  params: z.strictObject({
    storyId: generalValidationFields.id,
  }),
};
