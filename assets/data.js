/* Atomix sizing data. Edit this file to update prices: everything the
   calculator shows comes from here. Prices are list prices gathered in
   November 2026 from the providers' public pages and price trackers; they
   change often, so check the provider before you buy. EUR prices are
   converted at `eurUsd`. */
window.ATOMIX_DATA = {
  asOf: "November 2026",
  eurUsd: 1.1,

  /* Log mixes. `ratio` is raw bytes : bytes on disk, measured on real logs
     stored by Atomix (archive + column index). `bytes` is the average raw
     event size we saw for that source. */
  mixes: [
    { id: "mixed", label: "Mixed SOC (default)", ratio: 8, bytes: 1024, note: "EDR, firewall, cloud audit and servers together. A cautious blend." },
    { id: "edr", label: "Endpoint / EDR", ratio: 16, bytes: 1124, note: "Measured on Microsoft Defender tables: 16 : 1." },
    { id: "cloud", label: "Cloud audit (O365)", ratio: 59, bytes: 3313, note: "Measured on Office 365 audit logs: 59 : 1." },
    { id: "network", label: "Firewall / network", ratio: 7.6, bytes: 892, note: "Measured on firewall flows: 7.6 : 1." },
    { id: "worst", label: "Worst case", ratio: 5, bytes: 1200, note: "Mostly random, unique values. Nothing compresses well." }
  ],

  /* Atomix single-server tiers, from measured ingest and search cost.
     `max` is the EPS the tier covers. */
  atomix: {
    tiers: [
      { max: 500, vcpu: 4, ram: 8 },
      { max: 1000, vcpu: 8, ram: 16 },
      { max: 2500, vcpu: 8, ram: 24 },
      { max: 5000, vcpu: 16, ram: 32 },
      { max: 10000, vcpu: 24, ram: 64 },
      { max: 25000, vcpu: 32, ram: 128 },
      { max: 50000, vcpu: 48, ram: 192 }
    ],
    diskHeadroom: 1.3,   // keep 30% of the data disk free
    sidecarShare: 0.21,  // the column index stays local when archives move to S3
    cacheDays: 1         // RAM for the OS file cache: about one day of stored data
  },

  /* Elasticsearch sizing assumptions (editable on the page). */
  elastic: {
    indexFactor: 1.1,       // index size vs raw JSON (default codec)
    replicas: 1,            // one replica for any production cluster
    headroom: 1.25,         // disk watermarks: keep 20–25% free
    memDiskRatio: 30,       // hot data nodes: 1 GB RAM per 30 GB disk
    nodeRamGb: 64,          // 64 GB nodes, 31 GB JVM heap
    nodeVcpu: 16,
    minNodes: 3,            // quorum + replicas
    cloudRatePerGbRamHour: 0.0282, // Elastic Cloud hosted, Standard, hot node, us-east-1 (lowest cited rate)
    cloudRateHighPerGbRamHour: 0.1144 // the highest cited Standard-tier rate
  },

  /* Providers. `attachable` means fast block storage can be added to the
     server (cloud); otherwise the plan's own NVMe must hold the data and any
     overflow is network storage. `vcpu` counts hardware threads. `disk` is usable local SSD in
     GB (RAID 1 on dedicated servers). `diskRate` is extra block/attached
     storage per GB-month; `objectRate` is object storage (S3-style) per
     GB-month for the warm tier. */
  providers: [
    {
      id: "aws", name: "AWS", currency: "USD", attachable: true,
      note: "EC2 m7i on-demand in us-east-1, EBS gp3 at $0.08/GB, S3 Standard at $0.023/GB.",
      diskRate: 0.08, objectRate: 0.023,
      plans: [
        { name: "m7i.xlarge", vcpu: 4, ram: 16, disk: 0, price: 147.17 },
        { name: "m7i.2xlarge", vcpu: 8, ram: 32, disk: 0, price: 294.34 },
        { name: "m7i.4xlarge", vcpu: 16, ram: 64, disk: 0, price: 588.67 },
        { name: "m7i.8xlarge", vcpu: 32, ram: 128, disk: 0, price: 1177.34 },
        { name: "m7i.12xlarge", vcpu: 48, ram: 192, disk: 0, price: 1766.02 },
        { name: "m7i.16xlarge", vcpu: 64, ram: 256, disk: 0, price: 2354.69 }
      ],
      esNode: { name: "m7i.4xlarge", vcpu: 16, ram: 64, disk: 0, price: 588.67 }
    },
    {
      id: "hetzner", name: "Hetzner", currency: "EUR", attachable: false,
      note: "Dedicated AX servers (Germany, ex VAT), NVMe in RAID 1. Extra capacity as a Storage Box; for faster local NVMe add drives when ordering. Object Storage for the warm tier.",
      diskRate: 0.004, objectRate: 0.006,
      plans: [
        { name: "AX42", vcpu: 16, ram: 64, disk: 512, price: 57.3 },
        { name: "AX52", vcpu: 16, ram: 64, disk: 1000, price: 64 },
        { name: "AX102", vcpu: 32, ram: 128, disk: 1920, price: 122.3 },
        { name: "AX162-S", vcpu: 96, ram: 128, disk: 3840, price: 220 }
      ],
      esNode: { name: "AX52", vcpu: 16, ram: 64, disk: 1000, price: 64 }
    },
    {
      id: "contabo", name: "Contabo", currency: "EUR", attachable: false,
      note: "Cloud VDS (dedicated AMD EPYC cores, NVMe), monthly list prices. Extra capacity as Contabo Object Storage.",
      diskRate: 0.01, objectRate: 0.01,
      plans: [
        { name: "Cloud VDS S", vcpu: 6, ram: 24, disk: 180, price: 42.99 },
        { name: "Cloud VDS M", vcpu: 8, ram: 32, disk: 240, price: 55.99 },
        { name: "Cloud VDS L", vcpu: 12, ram: 48, disk: 360, price: 79.99 },
        { name: "Cloud VDS XL", vcpu: 16, ram: 64, disk: 480, price: 102.99 },
        { name: "Cloud VDS XXL", vcpu: 24, ram: 96, disk: 720, price: 149.99 }
      ],
      esNode: { name: "Cloud VDS XL", vcpu: 16, ram: 64, disk: 480, price: 102.99 }
    },
    {
      id: "digitalocean", name: "DigitalOcean", currency: "USD", attachable: true,
      note: "Memory-optimised Droplets, block storage at $0.10/GB, Spaces at $0.02/GB.",
      diskRate: 0.1, objectRate: 0.02,
      plans: [
        { name: "m-2vcpu-16gb", vcpu: 2, ram: 16, disk: 50, price: 84 },
        { name: "m-4vcpu-32gb", vcpu: 4, ram: 32, disk: 100, price: 168 },
        { name: "m-8vcpu-64gb", vcpu: 8, ram: 64, disk: 200, price: 336 },
        { name: "m-16vcpu-128gb", vcpu: 16, ram: 128, disk: 400, price: 672 },
        { name: "m-24vcpu-192gb", vcpu: 24, ram: 192, disk: 600, price: 1008 },
        { name: "m-32vcpu-256gb", vcpu: 32, ram: 256, disk: 800, price: 1344 }
      ],
      esNode: { name: "m-8vcpu-64gb", vcpu: 8, ram: 64, disk: 200, price: 336 }
    }
  ],

  sources: [
    { label: "AWS EC2 m7i on-demand and EBS gp3 pricing", url: "https://www.economize.cloud/resources/aws/pricing/ec2/m7i.4xlarge/" },
    { label: "Amazon EBS pricing (2026)", url: "https://www.eon.io/blog/ebs-pricing" },
    { label: "Hetzner dedicated servers: specs and pricing (2026)", url: "https://kuberns.com/blogs/hetzner-dedicated-server/" },
    { label: "Hetzner cloud and server price changes in 2026", url: "https://northflank.com/blog/hetzner-cloud-server-price-increases" },
    { label: "Contabo pricing: VPS, VDS, bare metal (2026)", url: "https://onedollarvps.com/pricing/contabo-pricing" },
    { label: "DigitalOcean Droplet pricing", url: "https://www.whtop.com/plans/digitalocean.com/137795" },
    { label: "Elastic Cloud pricing (2026)", url: "https://underdefense.com/industry-pricings/elastic-cloud-siem-pricing/" },
    { label: "Elasticsearch cluster sizing guide", url: "https://support.tools/elasticsearch-cluster-sizing-production-guide/" }
  ]
};
